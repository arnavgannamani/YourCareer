"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { Button } from "../../../../components/ui/button";
import SetupProgressBar from "../../../../components/SetupProgressBar";

export default function ParsingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [progress, setProgress] = useState(20);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    async function poll() {
      try {
        const res = await fetch(`/api/resume/${params.id}/status`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch status");
        setProgress(data.progress);
        setStatus(data.status);
        setError(data.error);

        if (data.status === "completed") {
          clearInterval(timer);
          setTimeout(() => router.push(`/resume/${params.id}/review`), 1200);
        }
        if (data.status === "failed") {
          clearInterval(timer);
        }
      } catch (e: any) {
        setError(e.message);
        clearInterval(timer);
      }
    }
    poll();
    timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [params.id, router]);

  const message =
    progress < 40 ? "Analyzing document..." : progress < 60 ? "Extracting contact info..." : progress < 80 ? "Parsing experience..." : "Finalizing...";

  return (
    <div className="min-h-screen bg-white">
      <SetupProgressBar currentStep={2} totalSteps={4} />
      
      <div className="max-w-xl mx-auto p-6">
        <Card>
        <CardHeader>
          <CardTitle>Parsing your resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">{message}</p>
          {status === "completed" && <p className="text-green-600">Completed! Redirecting...</p>}
          {status === "failed" && (
            <div className="space-y-2">
              <p className="text-red-600">Parsing failed: {error}</p>
              <Button onClick={() => router.push("/upload")}>Re-upload</Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


