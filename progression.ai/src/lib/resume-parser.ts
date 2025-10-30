import { Groq } from "groq-sdk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Strategy 1: Try pdf-parse (ESM or CJS)
    try {
        const esm = await import("pdf-parse").catch(() => null as any);
        const cjs = esm ?? ((): any => {
            try { return require("pdf-parse"); } catch { return null; }
        })();
        const pdfParse = typeof cjs === "function" ? cjs : cjs?.default;
        if (typeof pdfParse === "function") {
            const data = await pdfParse(buffer as any);
            const text = (data?.text || "").trim();
            if (text) return text;
        }
    } catch {}

    // Strategy 2: Fallback to pdfjs-dist text extraction (no worker, Node-safe)
    try {
        const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
        // Disable eval and worker to avoid Next/Node constraints
        const loadingTask = pdfjs.getDocument({
            data: buffer,
            isEvalSupported: false,
            useWorkerFetch: false,
            disableFontFace: true,
        });
        const pdf = await loadingTask.promise;
        let out = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strs = (content.items || []).map((it: any) => it?.str || "");
            out += strs.join(" ") + "\n";
        }
        return out.trim();
    } catch (e: any) {
        // Strategy 3: Python (PyMuPDF) fallback via child process
        try {
            const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
            fs.writeFileSync(tmpPath, buffer);
            const python = process.env.PYTHON_BIN || "python3";
            const scriptMu = path.join(process.cwd(), "scripts", "extract_pdf_text_pymupdf.py");
            const outputMu = await new Promise<string>((resolve, reject) => {
                const ps = spawn(python, [script, tmpPath], { stdio: ["ignore", "pipe", "pipe"] });
                let out = "";
                let err = "";
                ps.stdout.on("data", (d) => (out += d.toString()));
                ps.stderr.on("data", (d) => (err += d.toString()));
                ps.on("error", reject);
                ps.on("close", (code) => {
                    if (code === 0) resolve(out.trim());
                    else reject(new Error(err || `python exited with code ${code}`));
                });
            });
            try { fs.unlinkSync(tmpPath); } catch {}
            if (outputMu) return outputMu;
        } catch (pyMuErr: any) {
            // Strategy 4: Python (pdfminer.six) fallback via child process
            try {
                const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
                fs.writeFileSync(tmpPath, buffer);
                const python = process.env.PYTHON_BIN || "python3";
                const script = path.join(process.cwd(), "scripts", "extract_pdf_text.py");
                const output = await new Promise<string>((resolve, reject) => {
                    const ps = spawn(python, [script, tmpPath], { stdio: ["ignore", "pipe", "pipe"] });
                    let out = "";
                    let err = "";
                    ps.stdout.on("data", (d) => (out += d.toString()));
                    ps.stderr.on("data", (d) => (err += d.toString()));
                    ps.on("error", reject);
                    ps.on("close", (code) => {
                        if (code === 0) resolve(out.trim());
                        else reject(new Error(err || `python exited with code ${code}`));
                    });
                });
                try { fs.unlinkSync(tmpPath); } catch {}
                if (output) return output;
                throw new Error("empty output from pdfminer");
            } catch (pyErr: any) {
                throw new Error(`PDF text extraction failed: ${pyErr?.message || pyMuErr?.message || e?.message || "unknown"}`);
            }
        }
    }
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
	const mammoth = await import("mammoth");
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
	const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
	const chat = await groq.chat.completions.create({
		model,
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
