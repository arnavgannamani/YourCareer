"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Briefcase, Code, Activity } from "lucide-react";

interface Recommendation {
  action: string;
  estimatedDelta: number;
  category: string;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Education: Award,
  Experience: Briefcase,
  Impact: TrendingUp,
  Skills: Code,
  Activity: Activity,
  Certifications: Award,
};

export function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next +5 OVR</CardTitle>
        <CardDescription>Actions to improve your rating</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, idx) => {
          const Icon = categoryIcons[rec.category] || TrendingUp;
          
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="mt-0.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{rec.action}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {rec.category}
                  </Badge>
                  <span className="text-xs text-green-600 font-medium">
                    +{rec.estimatedDelta} pts
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Great work! Keep maintaining your profile.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

