import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

function toHighlights(ex: any): string[] {
  if (Array.isArray(ex?.highlights) && ex.highlights.length) return ex.highlights;
  if (Array.isArray(ex?.bullets) && ex.bullets.length) return ex.bullets;
  if (Array.isArray(ex?.points) && ex.points.length) return ex.points;
  // Try to parse bullets from description if present
  const desc: string = ex?.description || "";
  const lines = desc.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^[-•\*]/.test(l));
  return bulletLines.map((l) => l.replace(/^[-•\*]\s?/, ""));
}

function normalizeParsed(data: any) {
  const d = data || {};
  const contactSrc = d.contact || {};
  const contact = {
    name: contactSrc.name || contactSrc.full_name || contactSrc.fullName || "",
    email: contactSrc.email || contactSrc.mail || "",
    phone: contactSrc.phone || contactSrc.phoneNumber || contactSrc.phone_number || "",
    location: contactSrc.location || contactSrc.city || contactSrc.address || "",
    linkedin: contactSrc.linkedin || contactSrc.linkedin_url || "",
    github: contactSrc.github || contactSrc.github_url || "",
  };
  const education = Array.isArray(d.education) ? d.education : (Array.isArray(d.educations) ? d.educations : []);
  const experienceRaw = Array.isArray(d.experience) ? d.experience : (Array.isArray(d.experiences) ? d.experiences : []);
  const experience = experienceRaw.map((ex: any) => ({
    ...ex,
    highlights: toHighlights(ex),
  }));
  const skills = Array.isArray(d.skills) ? d.skills : (Array.isArray(d.skillset) ? d.skillset : []);
  const certifications = Array.isArray(d.certifications) ? d.certifications : (Array.isArray(d.certs) ? d.certs : []);
  const summary = d.summary || d.overview || d.profile || "";
  return { contact, education, experience, skills, certifications, summary };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resume = await prisma.resume.findFirst({ where: { id: params.id, user_id: (session.user as any).id, parsing_status: "completed" } });
  if (!resume) return NextResponse.json({ error: "Resume not ready" }, { status: 400 });

  let draft = await prisma.profileDraft.findFirst({ where: { user_id: (session.user as any).id, resume_id: resume.id } });
  if (!draft) {
    const initial = normalizeParsed((resume.parsed_data as any) ?? {});
    draft = await prisma.profileDraft.create({
      data: {
        user_id: (session.user as any).id,
        resume_id: resume.id,
        draft_data: initial,
        sections_reviewed: {},
        last_auto_saved: new Date(),
      },
    });
  } else if (draft && draft.draft_data && Object.keys(draft.draft_data as any).length > 0) {
    // Ensure existing drafts are normalized on read (non-destructive)
    const normalized = normalizeParsed(draft.draft_data as any);
    draft = { ...draft, draft_data: normalized } as any;
  }

  return NextResponse.json({ resumeId: resume.id, parsedData: draft.draft_data, sectionsReviewed: draft.sections_reviewed });
}


