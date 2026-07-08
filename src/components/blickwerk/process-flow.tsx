import { ProcessStep, type ProcessStepProps } from "./process-step";

export interface ProcessFlowProps {
  steps: ProcessStepProps[];
}

export function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <div className="w-full flex items-center justify-center px-4 gap-3 md:gap-4">
      {steps.map((step, i) => (
        <div key={`${step.icon}-${i}`} className="flex items-center gap-3 md:gap-4">
          <ProcessStep {...step} />
          {i < steps.length - 1 && (
            <svg
              aria-hidden
              viewBox="0 0 40 14"
              className="h-3.5 w-10 shrink-0 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="2" y1="7" x2="30" y2="7" />
              <polyline points="26,2 36,7 26,12" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
