"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Link as LinkIcon, CheckCircle, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "upload" | "linkedin" | "review">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect if already onboarded
  if (session?.user?.onboardingComplete) {
    router.push("/dashboard");
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      setError("Please upload a PDF or DOCX file");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(40);

      const response = await fetch("/api/parse-resume-bert", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse resume");
      }

      const data = await response.json();
      setUploadProgress(100);
      setParsedData(data.parsed);
      setStep("review");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(
        err.message || "Failed to parse resume. Please try again or enter information manually."
      );
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSubmit = async () => {
    if (!linkedInUrl) {
      setError("Please enter your LinkedIn profile URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parse-linkedin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: linkedInUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle "not implemented" gracefully
        if (response.status === 501 && data.needsManualEntry) {
          setError(data.message);
          // Offer to redirect to manual entry
          setTimeout(() => {
            router.push("/profile?mode=manual");
          }, 3000);
          return;
        }
        throw new Error(data.error || "Failed to parse LinkedIn profile");
      }

      setParsedData(data.parsed);
      setStep("review");
    } catch (err: any) {
      console.error("LinkedIn parse error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndSave = async () => {
    if (!parsedData) return;

    setLoading(true);
    setError("");

    try {
      // Save profile data
      const response = await fetch("/api/user/confirm-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          education: parsedData.education,
          experiences: parsedData.experiences,
          skills: parsedData.skills,
          certifications: parsedData.certifications,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      const result = await response.json();
      
      // Show success message with rating if available
      if (result.rating?.overall) {
        console.log(`✅ Profile saved! Your OVR: ${result.rating.overall}`);
      }

      // Update session to mark onboarding complete
      await update();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = step === "choose" ? 25 : step === "upload" || step === "linkedin" ? 50 : 75;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome to Progression!</h1>
          <p className="text-sm text-muted-foreground mb-1">Your Career, Quantified.</p>
          <p className="text-muted-foreground">
            Let's get your profile set up so we can calculate your career rating
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground text-center mt-2">
            Step {step === "choose" ? "1" : step === "review" ? "3" : "2"} of 3
          </p>
        </div>

        {/* Step 1: Choose Method */}
        {step === "choose" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <CardTitle>Upload Resume</CardTitle>
                </div>
                <CardDescription>
                  Upload your resume (PDF or DOCX) and we'll automatically extract your experience,
                  education, and skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  disabled={loading}
                />
                <label htmlFor="resume-upload">
                  <Button asChild className="w-full" size="lg" disabled={loading}>
                    <span>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose File
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-center mt-1 text-muted-foreground">
                      Parsing resume...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                  <CardTitle>Use LinkedIn Profile</CardTitle>
                </div>
                <CardDescription>
                  Paste your LinkedIn profile URL and we'll import your career information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setStep("linkedin")}
                  className="w-full"
                  size="lg"
                  variant="outline"
                  disabled={loading}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Enter LinkedIn URL
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: LinkedIn URL Input */}
        {step === "linkedin" && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Your LinkedIn Profile URL</CardTitle>
              <CardDescription>
                Example: https://www.linkedin.com/in/your-username
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="url"
                placeholder="https://www.linkedin.com/in/your-username"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setStep("choose")}
                  variant="outline"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleLinkedInSubmit}
                  className="flex-1"
                  disabled={loading || !linkedInUrl}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review Parsed Data */}
        {step === "review" && parsedData && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Information</CardTitle>
              <CardDescription>
                Please review the extracted information and make sure it looks correct
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Education */}
              {parsedData.education?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Education</h3>
                  <div className="space-y-2">
                    {parsedData.education.map((edu: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium">{edu.school}</p>
                        <p className="text-sm text-muted-foreground">
                          {edu.degree} {edu.major && `in ${edu.major}`}
                        </p>
                        {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {parsedData.experiences?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <div className="space-y-2">
                    {parsedData.experiences.map((exp: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        {exp.bullets?.length > 0 && (
                          <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                            {exp.bullets.slice(0, 3).map((bullet: string, i: number) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {parsedData.skills?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.slice(0, 20).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setStep("choose")} variant="outline" disabled={loading}>
                  Start Over
                </Button>
                <Button onClick={handleConfirmAndSave} className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm & Continue
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Skip Option */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push("/profile?mode=manual")}
            variant="ghost"
            disabled={loading}
          >
            Skip and enter manually
          </Button>
        </div>
      </div>
    </div>
  );
}

