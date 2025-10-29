  "use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface ExplanationsProps {
  explanations: string[];
}

export function Explanations({ explanations }: ExplanationsProps) {
  // Categorize explanations
  const getIcon = (text: string) => {
    if (text.includes("↑") || text.includes("favorable") || text.includes("Elite") || text.includes("Excellent")) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (text.includes("↓") || text.includes("challenging") || text.includes("needs") || text.includes("penalty")) {
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Why This Score?</CardTitle>
        <CardDescription>Key factors influencing your OVR</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {explanations.map((explanation, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">{getIcon(explanation)}</div>
              <span>{explanation}</span>
            </li>
          ))}
          {explanations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No explanations available
            </p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

