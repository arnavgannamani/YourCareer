import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Briefcase, GraduationCap, Award, Code } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch user profile data
  const [education, experiences, skills, certifications, resumes] = await Promise.all([
    prisma.education.findMany({ where: { userId: session.user.id }, orderBy: { endDate: "desc" } }),
    prisma.experience.findMany({ where: { userId: session.user.id }, orderBy: { startDate: "desc" } }),
    prisma.skillEndorsement.findMany({ where: { userId: session.user.id } }),
    prisma.certification.findMany({ where: { userId: session.user.id }, orderBy: { issuedOn: "desc" } }),
    prisma.resumeVersion.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 1 }),
  ]);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Present";
    return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your career information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/activity">Activity</Link>
            </Button>
          </div>
        </div>

        {/* Resume Upload Section */}
        {resumes.length === 0 && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>
                Get started by uploading your resume (PDF or DOCX)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg">Upload Resume</Button>
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: PDF, DOCX (max 10MB)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Education */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle>Education</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.length > 0 ? (
              education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-primary pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{edu.school}</h3>
                      <p className="text-sm text-muted-foreground">
                        {edu.degree}
                        {edu.major && ` in ${edu.major}`}
                      </p>
                      {edu.gpa && (
                        <p className="text-sm text-muted-foreground">GPA: {edu.gpa.toFixed(2)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Tier {edu.schoolTier || 3}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No education data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>Experience</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {experiences.length > 0 ? (
              experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-primary pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{exp.title}</h3>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Tier {exp.companyTier || 3}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </p>
                    </div>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {exp.bullets.slice(0, 3).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No experience data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Skills & Certifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle>Skills</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <Badge key={skill.id} variant={skill.verified ? "default" : "secondary"}>
                      {skill.skill}
                      {skill.level && ` (${skill.level}/5)`}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center w-full py-4">
                    No skills listed yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle>Certifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {certifications.length > 0 ? (
                certifications.map((cert) => (
                  <div key={cert.id} className="border-b pb-2 last:border-0">
                    <p className="font-medium text-sm">{cert.name}</p>
                    {cert.authority && (
                      <p className="text-xs text-muted-foreground">{cert.authority}</p>
                    )}
                    {cert.issuedOn && (
                      <p className="text-xs text-muted-foreground">
                        Issued: {formatDate(cert.issuedOn)}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No certifications yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

