import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { Cycle } from "@/lib/mock-data";
import { median } from "@/lib/mock-data";

interface Props {
  cycles: Cycle[];
  onCycleClick?: (videoTimestampStart: number) => void;
}

export function CycleTimeChart({ cycles, onCycleClick }: Props) {
  const med = median(cycles.map((c) => c.duration_sec));
  const threshold = med * 1.5;

  const data = cycles.map((c, i) => ({
    idx: i + 1,
    time: new Date(c.start_ts).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: c.duration_sec,
    outlier: c.duration_sec > threshold ? c.duration_sec : null,
    vStart: c.video_timestamp_start,
  }));

  const outliers = data.filter((d) => d.outlier != null).length;

  const handleClick = (state: unknown) => {
    if (!onCycleClick) return;
    const s = state as { activePayload?: Array<{ payload?: { vStart?: number } }> };
    const v = s?.activePayload?.[0]?.payload?.vStart;
    if (typeof v === "number") onCycleClick(v);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Zykluszeit-Verlauf</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Median {med.toFixed(2)} s · Schwellwert {threshold.toFixed(1)} s ·{" "}
            <span className="text-warning font-medium">{outliers} Ausreißer</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-primary" />
            Dauer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" />
            Ausreißer
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="idx"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval={19}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, "auto"]}
              unit=" s"
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => `${v.toFixed(2)} s`}
              labelFormatter={(l, p) => `Zyklus #${l} · ${p?.[0]?.payload?.time ?? ""}`}
            />
            <ReferenceLine
              y={threshold}
              stroke="var(--warning)"
              strokeDasharray="4 4"
              label={{
                value: "Schwellwert",
                fill: "var(--warning)",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="duration"
              stroke="var(--primary)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Scatter dataKey="outlier" fill="var(--warning)" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
