"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function ResetOnboardingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset your onboarding? This will allow you to upload your resume again.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/reset-onboarding", {
        method: "POST",
      });

      if (response.ok) {
        // Redirect to onboarding
        router.push("/onboarding");
        router.refresh();
      } else {
        alert("Failed to reset onboarding. Please try again.");
      }
    } catch (error) {
      console.error("Reset error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReset}
      variant="outline"
      size="lg"
      disabled={loading}
    >
      {loading ? "Resetting..." : "Reset Onboarding"}
    </Button>
  );
}

