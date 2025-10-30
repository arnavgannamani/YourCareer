import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

function yearsFromExperience(experience: any[]): number {
	let months = 0;
	experience.forEach((e) => {
		const start = e?.start_date ? new Date(e.start_date) : null;
		const end = !e?.end_date || /present/i.test(e.end_date) ? new Date() : new Date(e.end_date);
		if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
			months += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
		}
	});
	return Math.round(months / 12);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const resumeId = params.id;
	const body = await req.json();

	const contact = body?.contact;
	const education = Array.isArray(body?.education) ? body.education : [];
	const experience = Array.isArray(body?.experience) ? body.experience : [];
	const skills = Array.isArray(body?.skills) ? body.skills : [];
	const certifications = Array.isArray(body?.certifications) ? body.certifications : [];
	const summary = body?.summary || "";

	if (!contact?.name || !contact?.location) {
		return NextResponse.json({ error: "Contact name and location required" }, { status: 422 });
	}
	if (education.length < 1) return NextResponse.json({ error: "At least 1 education entry required" }, { status: 422 });
	if (experience.length < 1) return NextResponse.json({ error: "At least 1 experience entry required" }, { status: 422 });
	if (skills.length < 3) return NextResponse.json({ error: "At least 3 skills required" }, { status: 422 });

	const years = yearsFromExperience(experience);

	const profile = await prisma.userProfile.create({
		data: {
			user_id: (session.user as any).id,
			resume_id: resumeId,
			contact,
			career_field: body?.career_field || null,
			years_of_experience: years,
			education,
			experience,
			skills,
			certifications: certifications.length ? certifications : null,
			summary,
			profile_completeness: 100,
			is_confirmed: true,
			confirmed_at: new Date(),
		},
	});

	return NextResponse.json({ success: true, profileId: profile.id });
}
