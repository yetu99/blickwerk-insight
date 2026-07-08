export type VdiIconKey =
  | "halten"
  | "loesen"
  | "pruefen"
  | "verzweigen"
  | "positionieren"
  | "spannen"
  | "zaehlen"
  | "teilen"
  | "fuehren"
  | "orientieren"
  | "sortieren"
  | "speichern"
  | "picking"
  | "legen"
  | "einsetzen";

const SVG_ICONS = new Set<VdiIconKey>(["picking", "legen", "einsetzen"]);

export interface ProcessStepProps {
  icon: VdiIconKey;
  label: string;
  duration?: string;
}

export function ProcessStep({ icon, label, duration }: ProcessStepProps) {
  const ext = SVG_ICONS.has(icon) ? "svg" : "png";
  return (
    <div className="flex flex-col items-center shrink-0 w-24">
      <div className="text-[10px] tabular-nums text-muted-foreground h-4">
        {duration ?? ""}
      </div>
      <img
        src={`/vdi2860/${icon}.${ext}`}
        alt={label}
        width={80}
        height={80}
        className="w-20 h-20 object-contain"
      />
      <div className="mt-1 text-[11px] font-medium text-foreground text-center leading-tight">
        {label}
      </div>
    </div>
  );
}
