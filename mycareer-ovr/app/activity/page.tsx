import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, TrendingUp, Calendar } from "lucide-react";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch recent events
  const events = await prisma.progressEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Calculate XP by time period
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const xpLast7Days = events
    .filter((e) => new Date(e.createdAt) >= last7Days)
    .reduce((sum, e) => sum + e.value, 0);

  const xpLast30Days = events
    .filter((e) => new Date(e.createdAt) >= last30Days)
    .reduce((sum, e) => sum + e.value, 0);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventColor = (type: string) => {
    if (type.includes("offer") || type.includes("promotion")) return "default";
    if (type.includes("project") || type.includes("certification")) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Activity</h1>
            <p className="text-muted-foreground">Track your career progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile">Profile</Link>
            </Button>
          </div>
        </div>

        {/* XP Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Last 7 Days</CardDescription>
              <CardTitle className="text-3xl font-bold">{xpLast7Days.toFixed(1)} XP</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Last 30 Days</CardDescription>
              <CardTitle className="text-3xl font-bold">{xpLast30Days.toFixed(1)} XP</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Events</CardDescription>
              <CardTitle className="text-3xl font-bold">{events.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Log New Activity */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Log Activity</CardTitle>
            <CardDescription>
              Track micro-activities to boost your OVR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Blog Post
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                GitHub Commits
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Course Module
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Networking Call
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Mock Interview
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Activities are subject to daily caps and decay over 21 days
            </p>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Your career progression timeline</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-1">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getEventColor(event.type)}>
                          {event.type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-green-600 font-medium">
                          +{event.value.toFixed(1)} XP
                        </span>
                      </div>
                      {event.proofUrl && (
                        <a
                          href={event.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View proof
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No activities logged yet</p>
                <Button>Log Your First Activity</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

