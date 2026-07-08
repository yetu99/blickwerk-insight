import type { StepTimeInfo } from "@/lib/mock-data";
import { ProcessFlow } from "./process-flow";
import type { VdiIconKey } from "./process-step";

interface StepDef {
  icon: VdiIconKey;
  label: string;
  duration: string;
}

const STEPS: StepDef[] = [
  { icon: "picking", label: "Picking (Aufnehmen)", duration: "ca. 9,0 s" },
  { icon: "legen", label: "Legen (Platzieren)", duration: "6,0 s" },
  { icon: "einsetzen", label: "Einsetzen (Fügen)", duration: "ca. 4,0 s" },
];

export function VdiFlowDiagram({ stepTimes: _stepTimes }: { stepTimes: StepTimeInfo[] }) {
  return <ProcessFlow steps={STEPS} />;
}
