import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resumeId = params.id;
  const body = await req.json();
  const { draftUpdate, sectionsReviewed } = body as { draftUpdate?: any; sectionsReviewed?: any };

  const draft = await prisma.profileDraft.findFirst({ where: { user_id: (session.user as any).id, resume_id: resumeId } });
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const updated = await prisma.profileDraft.update({
    where: { id: draft.id },
    data: {
      draft_data: draftUpdate ? { ...(draft.draft_data as any), ...draftUpdate } : (draft.draft_data as any),
      sections_reviewed: sectionsReviewed ? { ...(draft.sections_reviewed as any), ...sectionsReviewed } : (draft.sections_reviewed as any),
      last_auto_saved: new Date(),
    },
  });

  return NextResponse.json({ success: true, draft: updated });
}


