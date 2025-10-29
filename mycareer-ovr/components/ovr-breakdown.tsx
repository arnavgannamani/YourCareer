"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BreakdownItem {
  factor: string;
  rawScore: number;
  weight: number;
  contribution: number;
}

interface OVRBreakdownProps {
  breakdown: BreakdownItem[];
}

export function OVRBreakdown({ breakdown }: OVRBreakdownProps) {
  // Find max contribution for scaling
  const maxContribution = Math.max(...breakdown.map((item) => item.contribution));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
        <CardDescription>How your OVR is calculated</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map((item) => {
          const percentage = maxContribution > 0 ? (item.contribution / maxContribution) * 100 : 0;
          
          return (
            <div key={item.factor} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.factor}</span>
                <span className="text-muted-foreground">
                  +{item.contribution.toFixed(1)} pts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={percentage} className="h-2" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {item.weight * 100}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Raw: {item.rawScore.toFixed(1)} × Weight: {item.weight.toFixed(2)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

