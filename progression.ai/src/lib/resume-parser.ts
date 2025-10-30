import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Groq } from "groq-sdk";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
	const data = await pdfParse(buffer);
	return (data.text || "").trim();
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
	const res = await mammoth.extractRawText({ buffer });
	return (res.value || "").trim();
}

function buildSystemPrompt(): string {
	return `You are a resume parser. Extract a strict JSON object with fields:
{
  "contact": {"name":"","email":"","phone":"","location":"","linkedin":"","github":""},
  "education": [{"school":"","degree":"","major":"","graduation_date":"","gpa":"","honors":""}],
  "experience": [{"company":"","title":"","start_date":"","end_date":"","location":"","description":"","highlights":[""]}],
  "skills": [""],
  "certifications": [{"name":"","issuer":"","date":""}],
  "summary": ""
}
If information is missing, use empty strings or empty arrays. Output only JSON.`;
}

export async function parseResumeWithGroq(resumeText: string): Promise<any> {
	const groq = new Groq({ apiKey: process.env.GROQ_API_KEY as string });
	const prompt = `${buildSystemPrompt()}\nResume:\n${resumeText}`;
	const chat = await groq.chat.completions.create({
		model: "llama-3.1-70b-versatile",
		temperature: 0.1,
		messages: [
			{ role: "system", content: buildSystemPrompt() },
			{ role: "user", content: resumeText.slice(0, 100000) },
		],
		max_tokens: 3000,
		top_p: 0.9,
	});
	const content = chat.choices[0]?.message?.content || "";
	const jsonMatch = content.match(/```json[\s\S]*?```|\{[\s\S]*\}/);
	const jsonText = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : content.trim();
	const data = JSON.parse(jsonText);
	return validateParsedResume(data);
}

export function validateParsedResume(data: any) {
	const cleaned = {
		contact: data?.contact || {},
		education: Array.isArray(data?.education) ? data.education : [],
		experience: Array.isArray(data?.experience) ? data.experience : [],
		skills: Array.isArray(data?.skills) ? Array.from(new Set(data.skills)) : [],
		certifications: Array.isArray(data?.certifications) ? data.certifications : [],
		summary: data?.summary || "",
		parser_version: "1.0",
		parsed_at: new Date().toISOString(),
	};
	return cleaned;
}

export async function processResumeFile(buffer: Buffer, mimeType: string): Promise<any> {
	let text = "";
	if (mimeType === "application/pdf") {
		text = await extractTextFromPDF(buffer);
	} else if (
		mimeType === "application/msword" ||
		mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		text = await extractTextFromDocx(buffer);
	} else {
		throw new Error("Unsupported mime type");
	}
	if (text.trim().length < 50) throw new Error("Document text too short");
	return await parseResumeWithGroq(text);
}
