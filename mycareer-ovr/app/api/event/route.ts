import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const eventSchema = z.object({
  type: z.string(),
  metadata: z.record(z.any()),
  proofUrl: z.string().optional(),
  value: z.number(),
});

// XP values for different event types
const EVENT_VALUES: Record<string, number> = {
  // Macro events (high value)
  internship_offer: 12,
  fulltime_offer: 15,
  promotion: 10,
  major_project_launch: 8,
  
  // Micro events (smaller, decaying)
  blog_post: 1.5,
  github_commit: 0.2,
  kaggle_submission: 2,
  course_module_completed: 1,
  mock_interview: 0.8,
  networking_call: 0.5,
  certification_earned: 5,
};

// Daily caps per event type
const DAILY_CAPS: Record<string, number> = {
  github_commit: 5,
  blog_post: 1,
  networking_call: 3,
  course_module_completed: 5,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const data = eventSchema.parse(body);
    
    // Anti-gaming: check daily cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyCap = DAILY_CAPS[data.type];
    if (dailyCap) {
      const todayCount = await prisma.progressEvent.count({
        where: {
          userId: session.user.id,
          type: data.type,
          createdAt: {
            gte: today,
          },
        },
      });
      
      if (todayCount >= dailyCap) {
        return NextResponse.json(
          { error: `Daily cap reached for ${data.type} (${dailyCap}/day)` },
          { status: 429 }
        );
      }
    }
    
    // Anti-gaming: check for duplicates (same type + proof URL)
    if (data.proofUrl) {
      const existing = await prisma.progressEvent.findFirst({
        where: {
          userId: session.user.id,
          type: data.type,
          proofUrl: data.proofUrl,
        },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: "Duplicate event detected" },
          { status: 400 }
        );
      }
    }
    
    // Create event
    const event = await prisma.progressEvent.create({
      data: {
        userId: session.user.id,
        type: data.type,
        metadata: data.metadata as any,
        proofUrl: data.proofUrl,
        value: data.value,
      },
    });
    
    // For macro events, also update experiences if relevant
    if (
      data.type === "internship_offer" ||
      data.type === "fulltime_offer" ||
      data.type === "promotion"
    ) {
      // TODO: Optionally create/update Experience record
    }
    
    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const events = await prisma.progressEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    );
  }
}

