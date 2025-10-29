import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user needs onboarding
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingComplete: true, profileComplete: true },
  });

  if (!user?.onboardingComplete) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

