import { ProcessStep, type ProcessStepProps } from "./process-step";

export interface ProcessFlowProps {
  steps: ProcessStepProps[];
}

export function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-center gap-10 md:gap-14 min-w-max mx-auto px-4">
        {steps.map((step, i) => (
          <div
            key={`${step.icon}-${i}`}
            className="flex items-center gap-10 md:gap-14"
          >
            <ProcessStep {...step} />
            {i < steps.length - 1 && (
              <svg
                aria-hidden
                viewBox="0 0 80 12"
                className="h-3 w-16 md:w-20 shrink-0 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="2" y1="6" x2="70" y2="6" />
                <polyline points="62,1 72,6 62,11" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
