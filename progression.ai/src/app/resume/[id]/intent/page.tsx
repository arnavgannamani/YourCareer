"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

const STAGES = ["High School", "College", "Postgrad", "Professional"] as const;

const CAREER_GROUPS: Record<string, string[]> = {
  Engineering: [
    "Software Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "Mobile Engineer",
    "Data Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Security Engineer",
  ],
  "Data & Analytics": [
    "Data Science",
    "Data Analyst",
    "Business Analyst",
    "Analytics Engineer",
  ],
  "Product & Design": [
    "Product Management",
    "Product Design",
    "UX Design",
    "UI Design",
  ],
  "Finance & Trading": [
    "Quant/Trading",
    "Finance",
    "Investment Banking",
  ],
  Business: [
    "Consulting",
    "Strategy",
    "Operations",
    "Marketing",
    "Sales",
    "Business Development",
  ],
  Other: ["Other"],
};

export default function IntentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [stage, setStage] = useState<string>("");
  const [career, setCareer] = useState<string>("");
  const [customCareer, setCustomCareer] = useState<string>("");
  const [careerSearch, setCareerSearch] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("Engineering");
  const [showAll, setShowAll] = useState<boolean>(false);

  const effectiveCareer = career === "Other" ? customCareer : career;
  
  const allCareersFlat = Object.values(CAREER_GROUPS).flat();
  const baseList = selectedGroup === "All" ? allCareersFlat : CAREER_GROUPS[selectedGroup] || [];
  const filteredCareers = baseList.filter((c) => c.toLowerCase().includes(careerSearch.toLowerCase()));
  const visibleCareers = showAll ? filteredCareers : filteredCareers.slice(0, 12);

  async function saveIntent() {
    if (!stage || !effectiveCareer) return;
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/resume/${params.id}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftUpdate: { intent: { stage, career: effectiveCareer } } }),
      });
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function continueNext() {
    await saveIntent();
    try {
      const res = await fetch(`/api/resume/${params.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const j = await res.json();
        setError(j?.error || "Confirmation failed");
      }
    } catch (e: any) {
      setError(e?.message || "Confirmation failed");
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/circular logo.png" alt="Progression" width={32} height={32} className="rounded-full" />
            <span className="text-xl font-semibold text-[#007A33]">Progression</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-medium bg-[#007A33]/10 text-[#007A33] px-3 py-1 rounded-full border border-[#007A33]/20">Step 2 · Intent</div>
            </div>
            <CardTitle className="mt-2">Select Your Stage and Career</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">Current Stage</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                      stage === s
                        ? "border-[#007A33] bg-[#007A33] text-white shadow-md"
                        : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    <div className={`text-sm font-semibold ${stage === s ? "text-white" : "text-black"}`}>{s}</div>
                    <div className={`text-xs mt-1 ${stage === s ? "text-white/90" : "text-gray-600"}`}>
                      {s === "High School" && "Exploring internships and early experiences"}
                      {s === "College" && "Internships, co-ops, first roles"}
                      {s === "Postgrad" && "MS/PhD pathways and specialized roles"}
                      {s === "Professional" && "Industry roles and progression"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Target Career</p>
                {career && (
                  <button
                    type="button"
                    onClick={() => {
                      setCareer("");
                      setCustomCareer("");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Input
                placeholder="Search careers..."
                value={careerSearch}
                onChange={(e) => setCareerSearch(e.target.value)}
                className="mb-3"
              />
              {/* Category filter - single row, horizontally scrollable */}
              <div className="overflow-x-auto mb-4 flex justify-center">
                <div className="inline-flex gap-2 min-w-max">
                  {(["All", ...Object.keys(CAREER_GROUPS)]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { setSelectedGroup(g); setShowAll(false); }}
                      className={`text-xs rounded-full px-3 py-1 border transition whitespace-nowrap ${
                        selectedGroup === g
                          ? "border-[#007A33] bg-[#007A33]/10 text-[#007A33]"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {visibleCareers.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCareer(c)}
                    className={`rounded-lg border-2 p-3 text-center transition-all duration-200 ${
                      career === c
                        ? "border-[#007A33] bg-[#007A33] text-white shadow-md scale-105"
                        : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="text-xs font-semibold">{c}</div>
                  </button>
                ))}
              </div>
              {filteredCareers.length > 12 && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-xs text-[#007A33] hover:underline"
                    onClick={() => setShowAll((s) => !s)}
                  >
                    {showAll ? "Show less" : `Show ${filteredCareers.length - 12} more`}
                  </button>
                </div>
              )}
              {career === "Other" && (
                <div className="mt-4">
                  <Input 
                    placeholder="Enter your target career" 
                    value={customCareer} 
                    onChange={(e) => setCustomCareer(e.target.value)}
                    className="border-[#007A33] focus:border-[#007A33]"
                  />
                </div>
              )}
              {filteredCareers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No careers found matching "{careerSearch}"</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={saveIntent} disabled={!stage || !effectiveCareer || saving}>Save</Button>
              <Button onClick={continueNext} disabled={!stage || !effectiveCareer || saving} className="bg-[#007A33] hover:bg-[#006628]">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


