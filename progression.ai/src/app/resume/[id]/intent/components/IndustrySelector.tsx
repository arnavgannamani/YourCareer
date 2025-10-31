import { Input } from "../../../../../components/ui/input";

interface IndustrySelectorProps {
  industry: string;
  customIndustry: string;
  career: string;
  onIndustryChange: (industry: string) => void;
  onCustomIndustryChange: (customIndustry: string) => void;
}

const INDUSTRIES = [
  "Technology & Software",
  "Finance & Banking",
  "Healthcare & Biotech",
  "Consulting",
  "Retail & E-commerce",
  "Media & Entertainment",
  "Sports & Recreation",
  "Education",
  "Real Estate",
  "Energy & Utilities",
  "Manufacturing",
  "Automotive",
  "Aerospace & Defense",
  "Telecommunications",
  "Transportation & Logistics",
  "Non-Profit & Social Impact",
  "Government & Public Sector",
  "Agriculture & Food",
  "Hospitality & Travel",
  "Fashion & Apparel",
  "Other",
];

export default function IndustrySelector({
  industry,
  customIndustry,
  career,
  onIndustryChange,
  onCustomIndustryChange,
}: IndustrySelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">
          Target Industry
          {industry && <span className="ml-2 text-xs text-gray-500 font-normal">({industry} selected)</span>}
        </p>
        {industry && (
          <button
            type="button"
            onClick={() => {
              onIndustryChange("");
              onCustomIndustryChange("");
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Select the industry where you want to apply your {career || "career"}. For example: Data Analyst in Sports Industry.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            type="button"
            onClick={() => onIndustryChange(ind)}
            className={`rounded-lg border-2 p-3 text-center transition-all duration-200 ${
              industry === ind
                ? "border-[#007A33] bg-[#007A33] text-white shadow-md scale-105"
                : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <div className={`text-xs font-semibold ${industry === ind ? "text-white" : "text-black"}`}>
              {ind}
            </div>
          </button>
        ))}
      </div>
      {industry === "Other" && (
        <div className="mt-4">
          <Input
            placeholder="Enter your target industry"
            value={customIndustry}
            onChange={(e) => onCustomIndustryChange(e.target.value)}
            className="border-[#007A33] focus:border-[#007A33]"
          />
        </div>
      )}
    </div>
  );
}

