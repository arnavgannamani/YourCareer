import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { resumeQueue, ResumeParsingJob } from "../lib/queue";
import { prisma } from "../lib/prisma";
import { getResumeSignedUrl } from "../lib/storage";
import { processResumeFile } from "../lib/resume-parser";

async function downloadToTemp(url: string): Promise<{ filePath: string; buffer: Buffer }> {
	const res = await axios.get(url, { responseType: "arraybuffer" });
	const buffer = Buffer.from(res.data);
	const filePath = path.join(os.tmpdir(), `resume_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`);
	fs.writeFileSync(filePath, buffer);
	return { filePath, buffer };
}

resumeQueue.process(async (job) => {
	const { resumeId } = job.data as ResumeParsingJob;
	try {
		await prisma.resume.update({ where: { id: resumeId }, data: { parsing_status: "processing" } });
		const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
		if (!resume) throw new Error("Resume not found");
		const signed = await getResumeSignedUrl(resume.file_url);
		const { filePath, buffer } = await downloadToTemp(signed);
		try {
			const parsed = await processResumeFile(buffer, resume.mime_type);
			await prisma.resume.update({
				where: { id: resumeId },
				data: { parsing_status: "completed", parsed_data: parsed, parsed_at: new Date() },
			});
			await prisma.profileDraft.create({
				data: {
					user_id: resume.user_id,
					resume_id: resume.id,
					draft_data: parsed,
					sections_reviewed: {},
					last_auto_saved: new Date(),
				},
			});
		} finally {
			try { fs.unlinkSync(filePath); } catch {}
		}
		return true;
	} catch (e: any) {
		await prisma.resume.update({
			where: { id: resumeId },
			data: { parsing_status: "failed", parsing_error: e?.message || "Unknown error" },
		});
		throw e;
	}
});

console.log("[worker] resume-parser-worker started");
