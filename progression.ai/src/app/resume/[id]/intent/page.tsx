"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { CheckCircle2 } from "lucide-react";

// Components
import StageSelector from "./components/StageSelector";
import CareerSelector from "./components/CareerSelector";
import IndustrySelector from "./components/IndustrySelector";
import ExplanationModal from "./components/ExplanationModal";

// Utils
import { recommendCareers, getCareerExplanation } from "./utils/careerRecommendations";

export default function IntentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [parsedData, setParsedData] = useState<any>(null);
  const [stage, setStage] = useState<string>("");
  const [career, setCareer] = useState<string>("");
  const [customCareer, setCustomCareer] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [customIndustry, setCustomIndustry] = useState<string>("");
  const [careerSearch, setCareerSearch] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [recommendedCareers, setRecommendedCareers] = useState<string[]>([]);
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [selectedCareerForExplanation, setSelectedCareerForExplanation] = useState<string>("");

  // Load parsed data and auto-detect stage/career
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/resume/${params.id}/review`);
        if (res.ok) {
          const json = await res.json();
          setParsedData(json.parsedData);
          
          const edu = json.parsedData?.education || [];
          const exp = json.parsedData?.experience || [];
          const skills = (json.parsedData?.skills || []).map((s: string) => s.toLowerCase());
          
          // Auto-detect stage
          const hasPhD = edu.some((e: any) => /phd|doctorate/i.test(e.degree || ""));
          const hasMasters = edu.some((e: any) => /masters?|ms|ma|mba/i.test(e.degree || ""));
          const hasBachelors = edu.some((e: any) => /bachelor|bs|ba|b\.?s\.?/i.test(e.degree || ""));
          const hasHighSchool = edu.some((e: any) => /high school|hs/i.test(e.degree || e.school || ""));
          
          let months = 0;
          exp.forEach((e: any) => {
            const start = e?.start_date ? new Date(e.start_date) : null;
            const end = !e?.end_date || /present|current/i.test(e.end_date) ? new Date() : new Date(e.end_date);
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              months += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
            }
          });
          const yearsExp = Math.round(months / 12);
          
          if (hasPhD || (hasMasters && yearsExp >= 2)) {
            setStage((prev) => prev || "Postgrad");
          } else if (hasMasters || hasBachelors || (yearsExp > 0)) {
            setStage((prev) => prev || (yearsExp >= 1 ? "Professional" : "College"));
          } else if (hasHighSchool) {
            setStage((prev) => prev || "High School");
          }
          
          // Auto-recommend careers
          const recommended = recommendCareers(skills, exp);
          setRecommendedCareers(recommended.careers);
          if (recommended.category) {
            setSelectedGroup((prev) => prev === "All" ? recommended.category || "All" : prev);
          }
        }
      } catch (e) {
        console.error("Failed to load profile data", e);
      }
    })();
  }, [params.id]);

  const effectiveCareer = career === "Other" ? customCareer : career;
  const effectiveIndustry = industry === "Other" ? customIndustry : industry;

  async function saveIntent() {
    if (!stage && !effectiveCareer && !effectiveIndustry) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/resume/${params.id}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          draftUpdate: { 
            intent: { 
              ...(stage ? { stage } : {}), 
              ...(effectiveCareer ? { career: effectiveCareer } : {}),
              ...(effectiveIndustry ? { industry: effectiveIndustry } : {})
            } 
          } 
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function continueNext() {
    await saveIntent();
    try {
      const res = await fetch(`/api/resume/${params.id}/confirm`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" } 
      });
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

  const handleShowExplanation = (careerName: string) => {
    setSelectedCareerForExplanation(careerName);
    setShowExplanationModal(true);
  };

  const handleSelectCareer = (careerName: string, category: string) => {
    setCareer(careerName);
    setSelectedGroup(category);
  };

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
              <div className="inline-flex items-center gap-2 text-xs font-medium bg-[#007A33]/10 text-[#007A33] px-3 py-1 rounded-full border border-[#007A33]/20">
                Step 2 · Intent
              </div>
            </div>
            <CardTitle className="mt-2">Select Your Stage and Career</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              We'll tailor your rating and recommendations based on these choices. You can change them anytime.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <StageSelector stage={stage} onStageChange={setStage} />

            <CareerSelector
              career={career}
              customCareer={customCareer}
              careerSearch={careerSearch}
              selectedGroup={selectedGroup}
              showAll={showAll}
              recommendedCareers={recommendedCareers}
              onCareerChange={setCareer}
              onCustomCareerChange={setCustomCareer}
              onCareerSearchChange={setCareerSearch}
              onGroupChange={setSelectedGroup}
              onShowAllToggle={() => setShowAll((s) => !s)}
              onShowExplanation={handleShowExplanation}
            />

            <IndustrySelector
              industry={industry}
              customIndustry={customIndustry}
              career={career}
              onIndustryChange={setIndustry}
              onCustomIndustryChange={setCustomIndustry}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            
            {saved && (
              <div className="flex items-center gap-2 text-sm text-[#007A33]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved ✓</span>
              </div>
            )}

            <div className="h-4" />
            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-3 sm:static sm:p-0 sm:border-0 sm:bg-transparent">
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
                <div className="flex-1 hidden sm:flex items-center gap-2">
                  {saving && <span className="text-xs text-gray-500">Saving...</span>}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={saveIntent} 
                    disabled={(!stage && !effectiveCareer && !effectiveIndustry) || saving}
                    className="flex-1 sm:flex-initial"
                  >
                    {saved ? "Saved ✓" : "Save"}
                  </Button>
                  <Button 
                    onClick={continueNext} 
                    disabled={!stage || saving} 
                    className="bg-[#007A33] hover:bg-[#006628] flex-1 sm:flex-initial"
                  >
                    {saving ? "Processing..." : "Continue → Generate OVR"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showExplanationModal && selectedCareerForExplanation && (
        <ExplanationModal
          career={selectedCareerForExplanation}
          reasons={getCareerExplanation(selectedCareerForExplanation, parsedData)}
          onClose={() => setShowExplanationModal(false)}
          onSelect={handleSelectCareer}
        />
      )}
    </div>
  );
}

