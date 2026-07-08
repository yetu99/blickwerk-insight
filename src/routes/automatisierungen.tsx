import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, Check, Loader2, Sparkles } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import {
  LINES,
  CATEGORY_TO_STEP,
  computeKpis,
  computeStepTimes,
  type ProcessStep,
} from "@/lib/mock-data";
import {
  useAllLines,
  useActiveSzenario,
  useSzenarienForLine,
} from "@/lib/runs-store";

export const Route = createFileRoute("/automatisierungen")({
  validateSearch: (s: Record<string, unknown>) => ({
    line: typeof s.line === "string" ? s.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Automatisierungen – symplify" },
      {
        name: "description",
        content:
          "Prozess-Ist-Zustand analysieren und Automatisierungspotenzial simulieren.",
      },
    ],
  }),
  component: AutomatisierungenPage,
});

type Badge = "good" | "limited" | "no";

const BADGE_STYLES: Record<Badge, { label: string; className: string }> = {
  good: {
    label: "gut automatisierbar",
    className: "bg-success/15 text-success border-success/40",
  },
  limited: {
    label: "bedingt automatisierbar",
    className: "bg-warning/15 text-warning-foreground border-warning/40",
  },
  no: {
    label: "nicht automatisierbar",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const SIM_STAGES = [
  "Prozessschritte werden in Simulationsmodell übersetzt...",
  "Automatisierungsszenario wird durchgerechnet...",
  "Wirtschaftlichkeit wird bewertet...",
];

// Simple seeded RNG (mulberry32) for stable per-szenario numbers.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function AutomatisierungenPage() {
  const search = Route.useSearch();
  const allLines = useAllLines();
  const lineId = search.line ?? allLines[0]?.line.id ?? LINES[0].id;
  const activeSz = useActiveSzenario(lineId);
  useSzenarienForLine(lineId); // reactivity

  const line = allLines.find((l) => l.line.id === lineId)?.line ?? LINES[0];

  const stepData = useMemo(() => {
    if (!activeSz) return null;
    const steps = computeStepTimes(activeSz.cycles);
    // Count timwoods_skills events per step for badges.
    const skillsByStep: Record<ProcessStep, number> = {
      Pick: 0,
      Place: 0,
      Kontrolle: 0,
      Korrektur: 0,
    };
    const totalByStep: Record<ProcessStep, number> = {
      Pick: 0,
      Place: 0,
      Kontrolle: 0,
      Korrektur: 0,
    };
    for (const e of activeSz.events) {
      const step = CATEGORY_TO_STEP[e.category];
      totalByStep[step]++;
      if (e.cluster_source === "timwoods_skills") skillsByStep[step]++;
    }
    const cyclesN = Math.max(1, activeSz.cycles.length);
    return steps.map((s) => {
      const skillsRatio = skillsByStep[s.step] / cyclesN;
      let badge: Badge = "good";
      if (skillsRatio > 0.15) badge = "no";
      else if (skillsRatio > 0.05) badge = "limited";
      return { step: s.step, avgTime: s.avgSec, badge, events: totalByStep[s.step] };
    });
  }, [activeSz]);

  const [simStage, setSimStage] = useState(-1);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (simStage < 0) return;
    if (simStage >= SIM_STAGES.length) {
      setShowResults(true);
      return;
    }
    const t = setTimeout(() => setSimStage((s) => s + 1), 1900);
    return () => clearTimeout(t);
  }, [simStage]);

  // Reset when szenario changes.
  useEffect(() => {
    setSimStage(-1);
    setShowResults(false);
  }, [activeSz?.id]);

  const simulation = useMemo(() => {
    if (!activeSz || !stepData) return null;
    const rand = mulberry32(hashCode(activeSz.id));
    const kpis = computeKpis(activeSz.cycles, activeSz.events);
    const currentTakt = kpis.avgCycle;
    const currentThroughputPerH = Math.round((3600 / Math.max(0.1, currentTakt)));
    // Weekly workload: assume 40h line time, 1 operator per cycle bottleneck.
    const workloadHours = 40;
    const improvement = 0.25 + rand() * 0.15; // 25–40 %
    const newTakt = currentTakt * (1 - improvement);
    const newThroughputPerH = Math.round(3600 / Math.max(0.1, newTakt));
    const newWorkload = workloadHours * (1 - improvement);
    const savedHours = workloadHours - newWorkload;
    return {
      current: {
        takt: currentTakt,
        throughput: currentThroughputPerH,
        workload: workloadHours,
      },
      future: {
        takt: newTakt,
        throughput: newThroughputPerH,
        workload: newWorkload,
      },
      savedHours,
      improvementPct: improvement * 100,
    };
  }, [activeSz, stepData]);

  const startSim = () => {
    setSimStage(0);
    setShowResults(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={line} />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Automatisierungen
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {line.name} · {activeSz?.label ?? "Kein Szenario aktiv"}
          </p>
        </header>

        <div className="flex-1 p-6 space-y-6 max-w-6xl">
          {/* Current state */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Prozess-Ist-Zustand
            </h2>
            {!stepData ? (
              <div className="text-xs text-muted-foreground">
                Kein Szenario-Datensatz verfügbar.
              </div>
            ) : (
              <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                {stepData.map((s, i) => {
                  const style = BADGE_STYLES[s.badge];
                  return (
                    <div key={s.step} className="flex items-center gap-2">
                      <div className="min-w-[160px] rounded-lg border border-border bg-background p-4">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Schritt {i + 1}
                        </div>
                        <div className="text-sm font-semibold text-foreground mb-2">
                          {s.step}
                        </div>
                        <div className="text-lg font-semibold tabular-nums text-foreground">
                          {s.avgTime.toFixed(2).replace(".", ",")} s
                        </div>
                        <div
                          className={`mt-2 inline-block text-[10px] font-medium border rounded px-1.5 py-0.5 ${style.className}`}
                        >
                          {style.label}
                        </div>
                      </div>
                      {i < stepData.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Simulation */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Digitaler Zwilling
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Simuliert Automatisierungsszenario auf Basis der aktuellen
                  Prozessdaten.
                </p>
              </div>
              <button
                onClick={startSim}
                disabled={!activeSz || (simStage >= 0 && !showResults)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                {showResults ? "Simulation wiederholen" : "Digitalen Zwilling simulieren"}
              </button>
            </div>

            {simStage >= 0 && !showResults && (
              <ul className="space-y-3 mb-4">
                {SIM_STAGES.map((label, i) => {
                  const done = i < simStage;
                  const active = i === simStage;
                  return (
                    <li key={label} className="flex items-center gap-3">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                          done
                            ? "bg-success/20 text-success"
                            : active
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground/60"
                        }`}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="text-[10px] tabular-nums">{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          done
                            ? "text-muted-foreground line-through"
                            : active
                              ? "text-foreground font-medium"
                              : "text-muted-foreground/70"
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {showResults && simulation && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <ResultCard
                    title="Aktuell"
                    takt={simulation.current.takt}
                    throughput={simulation.current.throughput}
                    workload={simulation.current.workload}
                    variant="current"
                  />
                  <ResultCard
                    title="Mit Automatisierung"
                    takt={simulation.future.takt}
                    throughput={simulation.future.throughput}
                    workload={simulation.future.workload}
                    variant="future"
                  />
                </div>

                <div className="rounded-lg bg-success/10 border border-success/40 p-4">
                  <div className="text-[11px] uppercase tracking-wider text-success mb-1">
                    Geschätzte Einsparung
                  </div>
                  <div className="text-xl font-semibold text-foreground tabular-nums">
                    {simulation.savedHours.toFixed(1).replace(".", ",")} Std./Woche
                    <span className="text-sm font-normal text-success ml-2">
                      (−{simulation.improvementPct.toFixed(0)} %)
                    </span>
                  </div>
                </div>
              </>
            )}

            <p className="text-[11px] text-muted-foreground mt-4">
              Vereinfachte Simulation zu Demonstrationszwecken, ersetzt keine
              reale Digital-Twin-Validierung (z. B. NVIDIA Isaac Sim).
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function ResultCard({
  title,
  takt,
  throughput,
  workload,
  variant,
}: {
  title: string;
  takt: number;
  throughput: number;
  workload: number;
  variant: "current" | "future";
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        variant === "future"
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-background"
      }`}
    >
      <div className="text-sm font-semibold text-foreground mb-3">{title}</div>
      <dl className="space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground text-xs">Taktzeit</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {takt.toFixed(2).replace(".", ",")} s
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground text-xs">Durchsatz</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {throughput} / h
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground text-xs">Arbeitszeit / Woche</dt>
          <dd className="tabular-nums font-medium text-foreground">
            {workload.toFixed(1).replace(".", ",")} h
          </dd>
        </div>
      </dl>
    </div>
  );
}
