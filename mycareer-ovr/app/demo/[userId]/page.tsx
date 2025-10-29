import { prisma } from "@/lib/db";
import { OVRDisplay } from "@/components/ovr-display";
import { OVRBreakdown } from "@/components/ovr-breakdown";
import { Explanations } from "@/components/explanations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export default async function DemoUserPage({ params }: { params: { userId: string } }) {
  // Fetch user by ID
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  });

  if (!user) {
    notFound();
  }

  // Fetch latest rating
  const latestRating = await prisma.ratingSnapshot.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Fetch profile data
  const [education, experiences, skills] = await Promise.all([
    prisma.education.findMany({ where: { userId: user.id } }),
    prisma.experience.findMany({ where: { userId: user.id }, orderBy: { startDate: "desc" } }),
    prisma.skillEndorsement.findMany({ where: { userId: user.id } }),
  ]);

  if (!latestRating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Demo: {user.name}</h1>
          <p className="text-muted-foreground">No rating calculated yet</p>
        </div>
      </div>
    );
  }

  const breakdown = latestRating.breakdown as any[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Demo Profile: {user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        {/* OVR Display */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-primary/20">
            <OVRDisplay
              overall={latestRating.overall}
              confidence={latestRating.confidence}
              size="lg"
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <OVRBreakdown breakdown={breakdown} />
          <Explanations explanations={latestRating.explanations} />
        </div>

        {/* Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Education</CardTitle>
            </CardHeader>
            <CardContent>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="font-medium text-sm">{edu.school}</p>
                  <p className="text-xs text-muted-foreground">{edu.degree}</p>
                  {edu.gpa && <Badge variant="outline" className="mt-1">GPA: {edu.gpa}</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {experiences.slice(0, 2).map((exp) => (
                <div key={exp.id} className="mb-2">
                  <p className="font-medium text-sm">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">{exp.company}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 8).map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-xs">
                    {skill.skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

