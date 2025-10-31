interface StageSelectorProps {
  stage: string;
  onStageChange: (stage: string) => void;
}

const STAGES = [
  { value: "High School", description: "Exploring internships and early experiences • 9-12th grade" },
  { value: "College", description: "Internships, co-ops, first roles • Undergraduate or recent grad" },
  { value: "Postgrad", description: "MS/PhD pathways and specialized roles • Graduate student or advanced degree" },
  { value: "Professional", description: "Industry roles and progression • Full-time work experience" },
];

export default function StageSelector({ stage, onStageChange }: StageSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium mb-3">
        Current Stage
        {stage && <span className="ml-2 text-xs text-gray-500 font-normal">({stage} selected)</span>}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STAGES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onStageChange(s.value)}
            className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
              stage === s.value
                ? "border-[#007A33] bg-[#007A33] text-white shadow-md"
                : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <div className={`text-sm font-semibold ${stage === s.value ? "text-white" : "text-black"}`}>
              {s.value}
            </div>
            <div className={`text-xs mt-1 ${stage === s.value ? "text-white/90" : "text-gray-600"}`}>
              {s.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

