import { ProcessStep, type ProcessStepProps } from "./process-step";

export interface ProcessFlowProps {
  steps: ProcessStepProps[];
}

export function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <div className="flex items-center gap-4 md:gap-6 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={`${step.icon}-${i}`} className="flex items-center gap-4 md:gap-6">
          <ProcessStep {...step} />
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="text-muted-foreground text-lg select-none shrink-0"
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
