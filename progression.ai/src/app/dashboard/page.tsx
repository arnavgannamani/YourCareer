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
    <div className="min-h-screen bg-white text-black">
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
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-[#007A33]/10 text-[#007A33] px-3 py-1 rounded-full border border-[#007A33]/20 mb-4">
            Career Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black mb-2">Your Career Dashboard</h1>
          <p className="text-gray-600">
            Track your professional growth and discover what's next
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - OVR Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-[#007A33] to-[#005a25] text-white border-0 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Overall Rating (OVR)</span>
                  </div>
                  
                  {/* OVR Number */}
                  <div className="relative mb-4">
                    <div className="text-8xl font-black mb-2 drop-shadow-2xl">
                      {mockData.ovr}
                    </div>
                    <div className="absolute inset-0 blur-3xl bg-white/30 -z-10" />
                  </div>

                  <div className="text-base opacity-90 mb-6 font-medium">
                    {mockData.careerField}
                  </div>

                  {/* Insight Card */}
                  <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-semibold">Ranking</span>
                    </div>
                    <p className="text-sm opacity-90 leading-relaxed">
                      Top {mockData.percentile}% in your field
                    </p>
                  </div>

                  {/* Next Milestone */}
                  <div className="pt-6 border-t border-white/20">
                    <div className="text-xs opacity-75 mb-2">Next Milestone</div>
                    <div className="text-sm font-semibold mb-2">OVR 80 → Expert Tier</div>
                    <Progress value={(mockData.ovr / 80) * 100} className="h-2 bg-white/20" />
                    <div className="text-xs opacity-75 mt-2">{80 - mockData.ovr} points to go</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Skills */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#007A33]" />
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockData.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs border-gray-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Breakdown & Suggestions */}
          <div className="lg:col-span-2 space-y-6">
            {/* OVR Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#007A33]" />
                  OVR Breakdown
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Detailed scores across key dimensions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {Object.entries(mockData.subscores).slice(0, 4).map(([skill, score]: [string, any]) => (
                    <div key={skill}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-black capitalize">
                          {skill.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#007A33]">{score}</span>
                          <span className="text-xs text-gray-500">/100</span>
                        </div>
                      </div>
                      <Progress value={score} className="h-3" />
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
                  AI-Powered Growth Suggestions
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Personalized actions to boost your OVR based on your profile
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockData.suggestions.map((suggestion: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#007A33] hover:bg-[#007A33]/5 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-14 h-14 rounded-full bg-[#007A33]/10 flex items-center justify-center group-hover:bg-[#007A33]/20 transition-colors">
                          <span className="text-xl font-bold text-[#007A33]">
                            +{suggestion.estimatedGain}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-black mb-1 group-hover:text-[#007A33] transition-colors">
                          {suggestion.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              suggestion.effort === "Low" ? "border-green-500 text-green-700" :
                              suggestion.effort === "Medium" ? "border-yellow-500 text-yellow-700" :
                              "border-red-500 text-red-700"
                            }`}
                          >
                            {suggestion.effort} Effort
                          </Badge>
                          <span>·</span>
                          <span>{suggestion.category}</span>
                          <span>·</span>
                          <span className="text-[#007A33] font-medium">+{suggestion.estimatedGain} OVR</span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-[#007A33] transition-colors" />
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

