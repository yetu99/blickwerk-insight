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
import type { Cycle, ProcessEvent } from "@/lib/mock-data";
import { median, CATEGORY_LABELS, CLUSTER_LABELS } from "@/lib/mock-data";

interface Props {
  cycles: Cycle[];
  onCycleClick?: (videoTimestampStart: number) => void;
  selectedEvent?: ProcessEvent | null;
  onCloseSelected?: () => void;
}

const SEVERITY_LABEL: Record<ProcessEvent["severity"], string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function CycleTimeChart({
  cycles,
  onCycleClick,
  selectedEvent,
  onCloseSelected,
}: Props) {
  const med = median(cycles.map((c) => c.duration_sec));
  const threshold = med * 1.5;

  const sortedCycles = [...cycles].sort((a, b) => a.start_ts - b.start_ts);
  const data = sortedCycles.map((c, i) => ({
    idx: i + 1,
    time: new Date(c.start_ts).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: c.duration_sec,
    outlier: c.duration_sec > threshold ? c.duration_sec : null,
    vStart: c.video_timestamp_start,
    cycleId: c.id,
  }));

  const outliers = data.filter((d) => d.outlier != null).length;

  // Map selected event → cycle index for a vertical marker on the chart
  let markerIdx: number | null = null;
  if (selectedEvent) {
    const idx = sortedCycles.findIndex((c) => c.id === selectedEvent.cycle_id);
    if (idx >= 0) markerIdx = idx + 1;
  }

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
          <ComposedChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }} onClick={handleClick} style={{ cursor: onCycleClick ? "pointer" : "default" }}>
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
            {markerIdx !== null && (
              <ReferenceLine
                x={markerIdx}
                stroke="var(--primary)"
                strokeWidth={2}
                label={{
                  value: "Ereignis",
                  fill: "var(--primary)",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}
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

      {selectedEvent && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {CATEGORY_LABELS[selectedEvent.category]}
              </div>
              <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                {fmtTime(selectedEvent.timestamp)}
                {selectedEvent.video_timestamp_start !== undefined && (
                  <>
                    {" · Video "}
                    {selectedEvent.video_timestamp_start.toFixed(1)}s
                    {selectedEvent.video_timestamp_end !== undefined
                      ? `–${selectedEvent.video_timestamp_end.toFixed(1)}s`
                      : ""}
                  </>
                )}
                {" · Zyklus "}
                {selectedEvent.cycle_id}
              </div>
            </div>
            <button
              onClick={onCloseSelected}
              className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0"
            >
              Schließen
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Schweregrad
              </div>
              <div className="text-sm font-medium mt-0.5">
                {SEVERITY_LABEL[selectedEvent.severity]}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Konfidenz
              </div>
              <div className="text-sm font-medium mt-0.5 tabular-nums">
                {(selectedEvent.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Quelle
              </div>
              <div className="text-sm font-medium mt-0.5 truncate">
                {CLUSTER_LABELS[selectedEvent.cluster_source]}
              </div>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {selectedEvent.description}
          </p>
        </div>
      )}
    </div>
  );
}
