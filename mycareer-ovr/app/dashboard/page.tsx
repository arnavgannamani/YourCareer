import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OVRDisplay } from "@/components/ovr-display";
import { OVRBreakdown } from "@/components/ovr-breakdown";
import { Recommendations } from "@/components/recommendations";
import { RatingChart } from "@/components/rating-chart";
import { Explanations } from "@/components/explanations";
import { GenerateRatingButton } from "@/components/generate-rating-button";
import { ResetOnboardingButton } from "@/components/reset-onboarding-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch latest rating
  const latestRating = await prisma.ratingSnapshot.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Fetch rating history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ratingHistory = await prisma.ratingSnapshot.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      overall: true,
      confidence: true,
      createdAt: true,
    },
  });

  // If no rating exists, check if profile data exists
  if (!latestRating) {
    // Check if user has any profile data
    const hasData = await prisma.education.count({ where: { userId: session.user.id } }) > 0 ||
                    await prisma.experience.count({ where: { userId: session.user.id } }) > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-4xl font-bold">Welcome to MyCareer OVR</h1>
            <p className="text-lg text-muted-foreground">
              {hasData 
                ? "Your profile data is ready. Generate your rating to see your OVR."
                : "Upload your resume to get started and receive your career rating"}
            </p>
            <div className="flex gap-4 justify-center">
              {hasData ? (
                <GenerateRatingButton />
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/onboarding">Get Started</Link>
                  </Button>
                  <ResetOnboardingButton />
                </>
              )}
            </div>
            {!hasData && (
              <p className="text-xs text-muted-foreground">
                Having issues? Click "Reset Onboarding" to try uploading your resume again.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const breakdown = latestRating.breakdown as any[];
  const recommendations = []; // Would come from API in real implementation

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/profile">Profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/activity">Activity</Link>
            </Button>
          </div>
        </div>

        {/* Hero Section - OVR Display */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-primary/20">
            <OVRDisplay
              overall={latestRating.overall}
              confidence={latestRating.confidence}
              size="lg"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rating Chart */}
          <div className="lg:col-span-2">
            <RatingChart data={ratingHistory} />
          </div>

          {/* Breakdown */}
          <OVRBreakdown breakdown={breakdown} />

          {/* Explanations */}
          <Explanations explanations={latestRating.explanations} />

          {/* Recommendations */}
          <div className="lg:col-span-2">
            <Recommendations recommendations={recommendations} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <GenerateRatingButton />
          <Button variant="outline" size="lg" asChild>
            <Link href="/activity">Log Activity</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

