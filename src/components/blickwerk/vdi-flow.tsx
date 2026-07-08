import type { StepTimeInfo } from "@/lib/mock-data";
import { ProcessFlow } from "./process-flow";
import type { VdiIconKey } from "./process-step";

interface StepDef {
  icon: VdiIconKey;
  label: string;
  duration: string;
}

const STEPS: StepDef[] = [
  { icon: "halten", label: "Picking (Aufnehmen)", duration: "8,7 s" },
  { icon: "positionieren", label: "Legen (Platzieren)", duration: "6,3 s" },
  { icon: "fuehren", label: "Einsetzen (Fügen)", duration: "4,2 s" },
];

export function VdiFlowDiagram({ stepTimes: _stepTimes }: { stepTimes: StepTimeInfo[] }) {
  return <ProcessFlow steps={STEPS} />;
}
