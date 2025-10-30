import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  const resume = await prisma.resume.findFirst({ where: { id, user_id: (session.user as any).id } });
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const status = resume.parsing_status;
  const progress = status === "pending" ? 20 : status === "processing" ? 60 : status === "completed" ? 100 : 0;

  return NextResponse.json({ status, progress, error: resume.parsing_error || null });
}


