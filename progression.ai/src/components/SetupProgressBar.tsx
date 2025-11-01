import React from 'react';
import { Upload, CheckSquare, Target } from 'lucide-react';

interface SetupProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, label: 'Upload', icon: Upload },
  { number: 2, label: 'Review', icon: CheckSquare },
  { number: 3, label: 'Intent', icon: Target },
];

export default function SetupProgressBar({ currentStep, totalSteps }: SetupProgressBarProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 py-6 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Steps Container */}
          <div className="flex items-start justify-between relative z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              const isUpcoming = step.number > currentStep;

              return (
                <div key={step.number} className="flex flex-col items-center gap-2">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isCompleted ? 'bg-[#007A33] text-white' : ''}
                      ${isCurrent ? 'bg-[#007A33] text-white ring-4 ring-[#007A33]/20' : ''}
                      ${isUpcoming ? 'bg-gray-200 text-gray-400' : ''}
                    `}
                    role="status"
                    aria-label={`Step ${step.number}: ${step.label} ${isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`
                      text-xs font-medium whitespace-nowrap transition-colors duration-300
                      ${isCompleted || isCurrent ? 'text-[#007A33]' : 'text-gray-400'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Connecting Lines - positioned absolutely through center of icons */}
          <div className="absolute top-5 left-0 right-0 flex items-center justify-between px-5 pointer-events-none">
            {steps.slice(0, -1).map((step, index) => (
              <div 
                key={`line-${step.number}`}
                className="flex-1 h-0.5 bg-gray-200 relative first:ml-0"
                style={{ marginLeft: index === 0 ? 0 : 0, marginRight: 0 }}
              >
                <div
                  className={`
                    absolute top-0 left-0 h-full bg-[#007A33] transition-all duration-500
                    ${step.number < currentStep ? 'w-full' : 'w-0'}
                  `}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

