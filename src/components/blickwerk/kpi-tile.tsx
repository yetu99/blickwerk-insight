import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Props {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  trend?: { direction: "up" | "down"; value: string; positive: boolean };
  hint?: string;
}

export function KpiTile({ label, value, unit, icon: Icon, trend, hint }: Props) {
  return (
    <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
          <Icon className="h-4 w-4 text-accent-foreground" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular-nums text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        ) : (
          <span />
        )}
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
