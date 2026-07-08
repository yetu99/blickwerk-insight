import type { StepTimeInfo, ProcessStep as ProcessStepType } from "@/lib/mock-data";
import { ProcessFlow } from "./process-flow";
import type { VdiIconKey } from "./process-step";

interface StepDef {
  icon: VdiIconKey;
  label: string;
  mapTo?: ProcessStepType;
}

const STEPS: StepDef[] = [
  { icon: "halten", label: "Halten (Aufnehmen)", mapTo: "Pick" },
  { icon: "pruefen", label: "Farbe prüfen", mapTo: "Kontrolle" },
  { icon: "verzweigen", label: "Verzweigen" },
  { icon: "positionieren", label: "Positionieren", mapTo: "Place" },
  { icon: "loesen", label: "Lösen (Freigeben)", mapTo: "Place" },
];

function fmt(v: number) {
  return v.toFixed(1).replace(".", ",");
}

export function VdiFlowDiagram({ stepTimes }: { stepTimes: StepTimeInfo[] }) {
  const timeMap = new Map(stepTimes.map((s) => [s.step, s]));
  const steps = STEPS.map((s) => {
    const t = s.mapTo ? timeMap.get(s.mapTo) : undefined;
    return {
      icon: s.icon,
      label: s.label,
      duration: t ? `${fmt(t.minSec)}–${fmt(t.maxSec)} s` : undefined,
    };
  });
  return <ProcessFlow steps={steps} />;
}
