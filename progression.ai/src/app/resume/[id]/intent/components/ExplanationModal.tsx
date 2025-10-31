import { Card, CardHeader, CardTitle, CardContent } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { X, Info } from "lucide-react";
import { CAREER_GROUPS } from "../constants";

interface ExplanationModalProps {
  career: string;
  reasons: string[];
  onClose: () => void;
  onSelect: (career: string, category: string) => void;
}

export default function ExplanationModal({ career, reasons, onClose, onSelect }: ExplanationModalProps) {
  const handleSelect = () => {
    // Find category for this career
    let category = "All";
    for (const [cat, careers] of Object.entries(CAREER_GROUPS)) {
      if (careers.includes(career)) {
        category = cat;
        break;
      }
    }
    onSelect(career, category);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg bg-white border-2 border-[#007A33] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-[#007A33]" />
            <CardTitle className="text-xl">Why {career}?</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Based on your resume, here's why we think this is a great match
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[#007A33]/5 border border-[#007A33]/20">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-[#007A33] text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">
                  {reason}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleSelect}
              className="w-full bg-[#007A33] hover:bg-[#006628] text-white"
            >
              Select {career}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

