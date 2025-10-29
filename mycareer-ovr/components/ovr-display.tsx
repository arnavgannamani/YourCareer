"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OVRDisplayProps {
  overall: number;
  confidence: number;
  showConfidence?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OVRDisplay({
  overall,
  confidence,
  showConfidence = true,
  size = "lg",
}: OVRDisplayProps) {
  // Color based on OVR
  const getOVRColor = (ovr: number) => {
    if (ovr >= 90) return "text-purple-600";
    if (ovr >= 80) return "text-blue-600";
    if (ovr >= 70) return "text-green-600";
    if (ovr >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            "font-bold tabular-nums",
            sizeClasses[size],
            getOVRColor(overall)
          )}
        >
          {overall}
        </div>
        <div className="text-center text-sm text-muted-foreground font-medium mt-1">
          OVR
        </div>
      </div>
      {showConfidence && (
        <Badge
          variant={confidence >= 0.7 ? "default" : "secondary"}
          className="text-xs"
        >
          {Math.round(confidence * 100)}% Confidence
        </Badge>
      )}
    </div>
  );
}

