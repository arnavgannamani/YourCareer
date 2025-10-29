"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface RatingDataPoint {
  id: string;
  overall: number;
  confidence: number;
  createdAt: string | Date;
}

interface RatingChartProps {
  data: RatingDataPoint[];
  period?: "30d" | "90d" | "all";
}

export function RatingChart({ data, period = "90d" }: RatingChartProps) {
  // Format data for chart
  const chartData = data.map((point) => ({
    date: format(new Date(point.createdAt), "MMM d"),
    ovr: point.overall,
    confidence: Math.round(point.confidence * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>OVR History</CardTitle>
        <CardDescription>Your rating over time</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                domain={[0, 99]}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey="ovr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No historical data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}

