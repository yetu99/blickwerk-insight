import { ProcessStep, type ProcessStepProps } from "./process-step";

export interface ProcessFlowProps {
  steps: ProcessStepProps[];
}

export function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <div className="w-full flex items-center justify-center px-4">
      {steps.map((step, i) => (
        <div
          key={`${step.icon}-${i}`}
          className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}
        >
          <ProcessStep {...step} />
          {i < steps.length - 1 && (
            <svg
              aria-hidden
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              className="h-3 flex-1 mx-2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            >
              <line x1="0" y1="6" x2="94" y2="6" vectorEffect="non-scaling-stroke" />
              <polyline points="88,1 98,6 88,11" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
