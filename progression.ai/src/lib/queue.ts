import Bull from "bull";

export interface ResumeParsingJob {
	resumeId: string;
	userId: string;
	filePath: string; // storage path (Supabase path)
}

const redisUrl = process.env.REDIS_URL as string;

export const resumeQueue = new Bull<ResumeParsingJob>("resume-parsing", redisUrl, {
	defaultJobOptions: {
		attempts: 2,
		backoff: { type: "exponential", delay: 1000 },
		removeOnComplete: true,
		removeOnFail: false,
	},
});
