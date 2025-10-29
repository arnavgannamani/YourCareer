"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function GenerateRatingButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rate", {
        method: "POST",
      });

      if (response.ok) {
        // Refresh the page to show the new rating
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to generate rating: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Generate rating error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      size="lg"
      disabled={loading}
    >
      {loading ? "Generating..." : "Generate My Rating"}
    </Button>
  );
}

