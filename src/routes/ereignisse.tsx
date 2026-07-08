import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Factory, ArrowRight } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";

import { LINES, computeKpis } from "@/lib/mock-data";
import { useAllLines, useSzenarienForLine, getSzenarienForLine } from "@/lib/runs-store";

export const Route = createFileRoute("/ereignisse")({
  head: () => ({
    meta: [
      { title: "Werkhalle – symplify" },
      {
        name: "description",
        content:
          "Maßstabsgetreuer 2D-Grundriss der Werkhalle mit farbcodierten Zonen nach Fehlerquote.",
      },
    ],
  }),
  component: WerkhallePage,
});

type Status = "ok" | "warn" | "bad";

function statusFor(errorRate: number): Status {
  if (errorRate < 10) return "ok";
  if (errorRate < 15) return "warn";
  return "bad";
}

const STATUS_FILL: Record<Status, string> = {
  ok: "var(--success)",
  warn: "var(--warning)",
  bad: "var(--destructive)",
};

const STATUS_LABEL: Record<Status, string> = {
  ok: "Stabil",
  warn: "Beobachten",
  bad: "Kritisch",
};

// Layout of the hall in an abstract 1200x720 grid.
// Coordinates map real spatial arrangement: entrance/warehouse left,
// production lines in the center, packaging/shipping right.
interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "line" | "aux";
  auxLabel?: string;
}

const AUX_ZONES: Zone[] = [
  { id: "aux-lager", label: "Wareneingang & Lager", x: 20, y: 20, w: 220, h: 320, kind: "aux" },
  { id: "aux-office", label: "Leitstand", x: 20, y: 360, w: 220, h: 140, kind: "aux" },
  { id: "aux-qs", label: "Qualitätssicherung", x: 20, y: 520, w: 220, h: 180, kind: "aux" },
  { id: "aux-pack", label: "Verpackung", x: 960, y: 20, w: 220, h: 320, kind: "aux" },
  { id: "aux-versand", label: "Versand", x: 960, y: 360, w: 220, h: 340, kind: "aux" },
];

const LINE_SLOTS: { id: string; x: number; y: number; w: number; h: number }[] = [
  { id: "line-1", x: 280, y: 40, w: 640, h: 190 },
  { id: "line-2", x: 280, y: 260, w: 640, h: 190 },
  { id: "line-3", x: 280, y: 480, w: 640, h: 200 },
];

function WerkhallePage() {
  const allLines = useAllLines();
  const navigate = useNavigate();
  useSzenarienForLine(allLines[0]?.line.id ?? "");


  const zones = useMemo(() => {
    return LINE_SLOTS.map((slot) => {
      const item = allLines.find((l) => l.line.id === slot.id);
      const line = item?.line;
      const sz = getSzenarienForLine(slot.id)[0];
      const kpis = sz ? computeKpis(sz.cycles, sz.events) : null;
      const errorRate = kpis?.errorRate ?? 0;
      return {
        slot,
        line,
        kpis,
        errorRate,
        status: statusFor(errorRate),
        hasData: !!sz,
      };
    });
  }, [allLines]);

  const summary = useMemo(() => {
    const c = { ok: 0, warn: 0, bad: 0 };
    for (const z of zones) c[z.status]++;
    return c;
  }, [zones]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={LINES[0]} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground">Werkhalle</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Maßstabsgetreuer Grundriss · Zonen nach Fehlerquote eingefärbt
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <LegendPill color={STATUS_FILL.ok} label={`Stabil (<10 %) · ${summary.ok}`} />
              <LegendPill color={STATUS_FILL.warn} label={`Beobachten (10–15 %) · ${summary.warn}`} />
              <LegendPill color={STATUS_FILL.bad} label={`Kritisch (>15 %) · ${summary.bad}`} />
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* Floor plan */}
          <section className="rounded-xl bg-card border border-border p-4 shadow-[var(--shadow-card)]">
            <div className="w-full overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] border border-border">
              <svg
                viewBox="0 0 1200 720"
                className="w-full h-auto block"
                role="img"
                aria-label="Grundriss der Werkhalle"
              >
                {/* subtle grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="0.5"
                      opacity="0.5"
                    />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="1200" height="720" fill="url(#grid)" />

                {/* Outer hall wall */}
                <rect
                  x="8"
                  y="8"
                  width="1184"
                  height="704"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeOpacity="0.35"
                  strokeWidth="3"
                  rx="6"
                />

                {/* Aux zones */}
                {AUX_ZONES.map((z) => (
                  <g key={z.id}>
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      fill="var(--muted)"
                      stroke="var(--border)"
                      strokeWidth="1.5"
                      rx="6"
                    />
                    <text
                      x={z.x + z.w / 2}
                      y={z.y + 22}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      fontSize="12"
                      fontWeight="500"
                    >
                      {z.label}
                    </text>
                  </g>
                ))}

                {/* Central corridor label */}
                <text
                  x={600}
                  y={710}
                  textAnchor="middle"
                  fill="var(--muted-foreground)"
                  fontSize="10"
                  opacity="0.7"
                >
                  ← Materialfluss · Halle 1/2 · 24 m × 14 m ↑
                </text>

                {/* Line zones */}
                {zones.map(({ slot, line, errorRate, status, hasData }) => {
                  const fill = STATUS_FILL[status];
                  return (
                    <g key={slot.id} className="cursor-pointer">
                      <Link to="/linien/$lineId" params={{ lineId: slot.id }}>
                        <rect
                          x={slot.x}
                          y={slot.y}
                          width={slot.w}
                          height={slot.h}
                          fill={fill}
                          fillOpacity={hasData ? 0.22 : 0.08}
                          stroke={fill}
                          strokeWidth={2.5}
                          rx={8}
                        />
                        {/* Machine iconography — conveyor + stations */}
                        <rect
                          x={slot.x + 24}
                          y={slot.y + slot.h / 2 - 8}
                          width={slot.w - 48}
                          height={16}
                          fill="var(--card)"
                          stroke={fill}
                          strokeOpacity={0.6}
                          strokeWidth={1}
                          rx={2}
                        />
                        {[0.2, 0.45, 0.7].map((f, i) => (
                          <circle
                            key={i}
                            cx={slot.x + 24 + (slot.w - 48) * f}
                            cy={slot.y + slot.h / 2}
                            r={12}
                            fill="var(--card)"
                            stroke={fill}
                            strokeWidth={1.5}
                          />
                        ))}

                        {/* Header label */}
                        <text
                          x={slot.x + 20}
                          y={slot.y + 28}
                          fill="var(--foreground)"
                          fontSize="15"
                          fontWeight="700"
                        >
                          {line?.name ?? slot.id}
                        </text>
                        <text
                          x={slot.x + 20}
                          y={slot.y + 46}
                          fill="var(--muted-foreground)"
                          fontSize="11"
                        >
                          {line?.location} · {line?.camera_id}
                        </text>

                        {/* Big error rate badge on the right */}
                        <g>
                          <rect
                            x={slot.x + slot.w - 160}
                            y={slot.y + 14}
                            width={140}
                            height={54}
                            rx={8}
                            fill="var(--card)"
                            stroke={fill}
                            strokeWidth={2}
                          />
                          <text
                            x={slot.x + slot.w - 90}
                            y={slot.y + 40}
                            textAnchor="middle"
                            fill={fill}
                            fontSize="22"
                            fontWeight="800"
                          >
                            {hasData ? `${errorRate.toFixed(1).replace(".", ",")} %` : "—"}
                          </text>
                          <text
                            x={slot.x + slot.w - 90}
                            y={slot.y + 58}
                            textAnchor="middle"
                            fill="var(--muted-foreground)"
                            fontSize="10"
                            fontWeight="600"
                            letterSpacing="0.5"
                          >
                            FEHLERQUOTE
                          </text>
                        </g>

                        {/* Status pill bottom-left */}
                        <g>
                          <rect
                            x={slot.x + 20}
                            y={slot.y + slot.h - 34}
                            width={110}
                            height={22}
                            rx={11}
                            fill={fill}
                            fillOpacity={0.15}
                            stroke={fill}
                            strokeWidth={1}
                          />
                          <circle
                            cx={slot.x + 32}
                            cy={slot.y + slot.h - 23}
                            r={4}
                            fill={fill}
                          />
                          <text
                            x={slot.x + 42}
                            y={slot.y + slot.h - 19}
                            fill={fill}
                            fontSize="11"
                            fontWeight="600"
                          >
                            {STATUS_LABEL[status]}
                          </text>
                        </g>
                      </Link>
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              Klick auf eine Linie öffnet die Detailansicht mit Fehleranalyse und Automatisierungspotenzial.
            </p>
          </section>

          {/* Zone list (accessible fallback + quick jump) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {zones.map(({ slot, line, kpis, errorRate, status, hasData }) => {
              const fill = STATUS_FILL[status];
              return (
                <Link
                  key={slot.id}
                  to="/linien/$lineId"
                  params={{ lineId: slot.id }}
                  className="group rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Factory className="h-4 w-4 text-primary shrink-0" />
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {line?.name ?? slot.id}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {line?.location}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold tabular-nums" style={{ color: fill }}>
                        {hasData ? `${errorRate.toFixed(1).replace(".", ",")} %` : "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Fehlerquote
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-foreground tabular-nums">
                        {kpis ? `${kpis.avgCycle.toFixed(2).replace(".", ",")} s` : "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Ø Taktzeit
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${fill} 15%, transparent)`,
                      color: fill,
                      border: `1px solid color-mix(in oklab, ${fill} 40%, transparent)`,
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: fill }} />
                    {STATUS_LABEL[status]}
                  </div>
                </Link>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border"
      style={{
        borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
        color: `color-mix(in oklab, ${color} 85%, var(--foreground))`,
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
