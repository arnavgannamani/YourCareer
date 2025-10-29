import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DemoIndexPage() {
  const users = await prisma.user.findMany({
    include: {
      ratings: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Progression - Demo</h1>
          <p className="text-sm text-muted-foreground">Your Career, Quantified.</p>
          <p className="text-lg text-muted-foreground">
            Click on a user to see their full dashboard with OVR breakdown
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.map((user) => {
            const latestRating = user.ratings[0];
            
            return (
              <Link key={user.id} href={`/demo/${user.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                      {latestRating && (
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {latestRating.overall}
                          </div>
                          <div className="text-xs text-muted-foreground">OVR</div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {latestRating ? (
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {Math.round(latestRating.confidence * 100)}% confidence
                        </Badge>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {latestRating.explanations[0] || "View full breakdown →"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No rating yet</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {users.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Demo Users Found</CardTitle>
              <CardDescription>Run the seed script to create demo users</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="bg-muted px-2 py-1 rounded">npm run db:seed</code>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


