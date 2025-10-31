import { Input } from "../../../../../components/ui/input";
import { Button } from "../../../../../components/ui/button";
import { Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { CAREER_GROUPS, CAREER_DESCRIPTIONS } from "../constants";

interface CareerSelectorProps {
  career: string;
  customCareer: string;
  careerSearch: string;
  selectedGroup: string;
  showAll: boolean;
  recommendedCareers: string[];
  onCareerChange: (career: string) => void;
  onCustomCareerChange: (customCareer: string) => void;
  onCareerSearchChange: (search: string) => void;
  onGroupChange: (group: string) => void;
  onShowAllToggle: () => void;
  onShowExplanation: (career: string) => void;
}

export default function CareerSelector({
  career,
  customCareer,
  careerSearch,
  selectedGroup,
  showAll,
  recommendedCareers,
  onCareerChange,
  onCustomCareerChange,
  onCareerSearchChange,
  onGroupChange,
  onShowAllToggle,
  onShowExplanation,
}: CareerSelectorProps) {
  const allCareersFlat = Object.values(CAREER_GROUPS).flat();
  const baseList = selectedGroup === "All" ? allCareersFlat : CAREER_GROUPS[selectedGroup] || [];
  const filteredCareers = baseList.filter((c) => c.toLowerCase().includes(careerSearch.toLowerCase()));
  const visibleCareers = showAll ? filteredCareers : filteredCareers.slice(0, 12);
  const displayedRecommended = recommendedCareers.filter((c) => c !== "Other");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">
          Target Career
          {career && <span className="ml-2 text-xs text-gray-500 font-normal">({career} selected)</span>}
        </p>
        {career && (
          <button
            type="button"
            onClick={() => {
              onCareerChange("");
              onCustomCareerChange("");
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Don't see an exact match? Pick the closest. You can change it anytime.</p>
        <button
          type="button"
          onClick={() => {
            onCareerChange("");
            onCustomCareerChange("");
          }}
          className="text-xs text-[#007A33] hover:underline"
        >
          Skip career for now
        </button>
      </div>

      {/* Recommended careers */}
      {displayedRecommended.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#007A33]/5 to-[#007A33]/10 border border-[#007A33]/20 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#007A33]" />
            <p className="text-sm font-semibold text-[#007A33]">AI Recommended for You</p>
            <TrendingUp className="h-3 w-3 text-[#007A33]" />
          </div>
          <p className="text-xs text-gray-600 mb-4">Based on your skills and experience</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {displayedRecommended.slice(0, 3).map((c, idx) => {
              const isSelected = career === c;
              return (
                <div key={c} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onCareerChange(c);
                      for (const [cat, careers] of Object.entries(CAREER_GROUPS)) {
                        if (careers.includes(c)) {
                          onGroupChange(cat);
                          break;
                        }
                      }
                    }}
                    className={`group w-full rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-[#007A33] bg-[#007A33] text-white shadow-md scale-105"
                        : "border-[#007A33] bg-white hover:bg-[#007A33] hover:text-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{c}</span>
                      <div className="flex items-center gap-1">
                        {idx === 0 && !isSelected && (
                          <span className="text-[10px] bg-[#007A33] text-white px-1.5 py-0.5 rounded-full">Best Match</span>
                        )}
                        {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    {CAREER_DESCRIPTIONS[c] && (
                      <p className={`text-[10px] line-clamp-2 mt-1 ${isSelected ? "text-white/90" : "text-gray-600 group-hover:text-white/80"}`}>
                        {CAREER_DESCRIPTIONS[c]}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowExplanation(c);
                    }}
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-white text-[#007A33] border-white hover:bg-gray-100"
                        : "bg-white text-[#007A33] border-[#007A33] hover:bg-[#007A33]/10"
                    }`}
                  >
                    See why
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Input
        placeholder="Search careers... (or browse categories below)"
        value={careerSearch}
        onChange={(e) => onCareerSearchChange(e.target.value)}
        className="mb-3"
      />
      {!careerSearch && (
        <p className="text-xs text-gray-500 mb-3">Not sure? Pick the closest match—you can change it anytime.</p>
      )}

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {(["All", ...Object.keys(CAREER_GROUPS)]).map((g) => {
          const displayLabel = g === "STEM & Research" ? "STEM" : g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => {
                onGroupChange(g);
                onShowAllToggle();
              }}
              className={`text-xs rounded-full px-3 py-1 border transition whitespace-nowrap ${
                selectedGroup === g
                  ? "border-[#007A33] bg-[#007A33]/10 text-[#007A33]"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {visibleCareers.map((c) => {
          const isRecommended = displayedRecommended.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onCareerChange(c)}
              className={`rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                career === c
                  ? "border-[#007A33] bg-[#007A33] text-white shadow-md scale-105"
                  : isRecommended
                  ? "border-[#007A33]/30 bg-[#007A33]/5 hover:border-[#007A33]/50 hover:bg-[#007A33]/10"
                  : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold flex-1">{c}</div>
                {isRecommended && !career && <Sparkles className="h-3 w-3 text-[#007A33] flex-shrink-0" />}
                {career === c && <CheckCircle2 className="h-3 w-3 text-white flex-shrink-0" />}
              </div>
              {CAREER_DESCRIPTIONS[c] && (
                <div className={`text-[10px] mt-1 line-clamp-2 ${career === c ? "text-white/80" : "text-gray-500"}`}>
                  {CAREER_DESCRIPTIONS[c]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {filteredCareers.length > 12 && (
        <div className="mt-3">
          <button
            type="button"
            className="text-xs text-[#007A33] hover:underline"
            onClick={onShowAllToggle}
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
            onChange={(e) => onCustomCareerChange(e.target.value)}
            className="border-[#007A33] focus:border-[#007A33]"
          />
        </div>
      )}

      {filteredCareers.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No careers found matching "{careerSearch}"</p>
      )}
    </div>
  );
}

