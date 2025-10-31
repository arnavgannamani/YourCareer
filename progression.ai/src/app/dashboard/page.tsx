"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Progress } from "../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ArrowUpRight, TrendingUp, Award, Target, Zap } from "lucide-react";

export default function DashboardPage() {
  // Mock data - will be replaced with real data later
  const mockData = {
    ovr: 74,
    percentile: 60,
    careerField: "Software Engineering",
    subscores: {
      technical: 82,
      leadership: 70,
      communication: 77,
      marketFit: 68,
      experience: 75,
      education: 80,
    },
    skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "PostgreSQL"],
    recentGrowth: [
      { action: "Completed AWS Certification", change: +2, date: "2 weeks ago" },
      { action: "Promoted to Senior Engineer", change: +5, date: "3 months ago" },
    ],
    suggestions: [
      {
        title: "Earn Google Cloud Fundamentals",
        effort: "Medium",
        estimatedGain: 0.8,
        category: "Certification",
      },
      {
        title: "Lead a Team Project",
        effort: "High",
        estimatedGain: 2.5,
        category: "Leadership",
      },
      {
        title: "Contribute to Open Source",
        effort: "Low",
        estimatedGain: 0.5,
        category: "Technical",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/circular logo.png"
              alt="Progression"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-semibold text-[#007A33]">Progression</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-[#007A33]">
              Dashboard
            </Link>
            <Link href="/upload" className="text-sm text-gray-600 hover:text-black">
              Upload Resume
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Your Career Dashboard</h1>
          <p className="text-gray-600">
            Track your professional growth and discover what's next
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - OVR Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-[#007A33] to-[#005a25] text-white">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Overall Rating</span>
                  </div>
                  
                  {/* OVR Badge */}
                  <div className="relative">
                    <div className="text-7xl font-black mb-2 drop-shadow-lg">
                      {mockData.ovr}
                    </div>
                    <div className="absolute inset-0 blur-3xl bg-white/20 -z-10" />
                  </div>

                  <div className="text-sm opacity-90 mb-4">
                    {mockData.careerField}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>Top {mockData.percentile}% in your field</span>
                  </div>

                  {/* Next Milestone */}
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="text-xs opacity-75 mb-2">Next Milestone</div>
                    <div className="text-sm font-semibold mb-2">OVR 80 → Expert Tier</div>
                    <Progress value={(mockData.ovr / 80) * 100} className="h-2" />
                    <div className="text-xs opacity-75 mt-2">{80 - mockData.ovr} points to go</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Growth */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#007A33]" />
                  Recent Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.recentGrowth.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="flex-shrink-0">
                        <Badge className="bg-[#007A33] text-white">
                          +{item.change}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-black">{item.action}</div>
                        <div className="text-xs text-gray-500">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Skills & Suggestions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockData.subscores).map(([skill, score]) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {skill.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-sm font-bold text-[#007A33]">{score}</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#007A33]" />
                  Suggested Actions
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Complete these to boost your OVR
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#007A33] hover:bg-[#007A33]/5 transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-12 h-12 rounded-full bg-[#007A33]/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-[#007A33]">
                            +{suggestion.estimatedGain}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-1">{suggestion.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.effort}
                          </Badge>
                          <span>·</span>
                          <span>{suggestion.category}</span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

