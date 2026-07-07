import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import {
  LINES,
  CATEGORY_LABELS,
  CATEGORY_TO_STEP,
  computeKpis,
  type EventCategory,
} from "@/lib/mock-data";
import { useAllLines, useSzenarienForLine, getSzenarienForLine } from "@/lib/runs-store";

export const Route = createFileRoute("/ereignisse")({
  head: () => ({
    meta: [
      { title: "Ereignisse – symplify" },
      {
        name: "description",
        content:
          "Linienübergreifende Fehleranalyse: Ranking, dominierende Kategorien und Muster.",
      },
    ],
  }),
  component: EreignissePage,
});

interface LineStepRow {
  lineId: string;
  lineName: string;
  step: string;
  errorRate: number;
  dominantCategory: EventCategory | null;
  cycles: number;
  events: number;
}

function EreignissePage() {
  const allLines = useAllLines();
  // Touch szenarien for reactivity of the first line so navigation-triggered
  // additions rerender.
  useSzenarienForLine(allLines[0]?.line.id ?? "");

  const rows = useMemo<LineStepRow[]>(() => {
    const out: LineStepRow[] = [];
    for (const { line } of allLines) {
      // Use the latest szenario per line as representative.
      const szList = getSzenarienForLine(line.id);
      const sz = szList[0];
      if (!sz) continue;

      // Group events by step.
      const byStep = new Map<string, EventCategory[]>();
      for (const e of sz.events) {
        const step = CATEGORY_TO_STEP[e.category];
        const arr = byStep.get(step) ?? [];
        arr.push(e.category);
        byStep.set(step, arr);
      }
      for (const [step, cats] of byStep.entries()) {
        const counts = cats.reduce<Record<string, number>>((acc, c) => {
          acc[c] = (acc[c] ?? 0) + 1;
          return acc;
        }, {});
        const dominant = Object.entries(counts).sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0] as EventCategory | undefined;
        out.push({
          lineId: line.id,
          lineName: line.name,
          step,
          errorRate: (cats.length / Math.max(1, sz.cycles.length)) * 100,
          dominantCategory: dominant ?? null,
          cycles: sz.cycles.length,
          events: cats.length,
        });
      }
    }
    return out.sort((a, b) => b.errorRate - a.errorRate);
  }, [allLines]);

  const insights = useMemo(() => generateInsights(allLines), [allLines]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={LINES[0]} />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Ereignisse</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Linien-übergreifende Fehleranalyse über alle gespeicherten Szenarien.
          </p>
        </header>

        <div className="flex-1 p-6 space-y-6 max-w-6xl">
          <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="p-5 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Fehleranfälligkeit nach Linie & Prozessschritt
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Absteigend nach Fehlerquote. Prozessschritt aus Kategorie
                abgeleitet.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium">Linie</th>
                    <th className="text-left px-5 py-2.5 font-medium">
                      Prozessschritt
                    </th>
                    <th className="text-right px-5 py-2.5 font-medium">
                      Fehlerquote
                    </th>
                    <th className="text-left px-5 py-2.5 font-medium">
                      Dominierende Kategorie
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-6 text-center text-muted-foreground text-xs"
                      >
                        Noch keine Ereignisdaten verfügbar.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={`${r.lineId}-${r.step}-${i}`}>
                        <td className="px-5 py-2.5 text-foreground">
                          {r.lineName}
                        </td>
                        <td className="px-5 py-2.5 text-foreground">{r.step}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums font-medium">
                          <span
                            className={
                              r.errorRate > 15
                                ? "text-destructive"
                                : r.errorRate > 8
                                  ? "text-warning-foreground"
                                  : "text-foreground"
                            }
                          >
                            {r.errorRate.toFixed(1).replace(".", ",")} %
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground text-xs">
                          {r.dominantCategory
                            ? CATEGORY_LABELS[r.dominantCategory]
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Linienübergreifende Muster
            </h2>
            {insights.length === 0 ? (
              <div className="text-xs text-muted-foreground rounded-lg border border-dashed border-border p-4">
                Zu wenig Daten für Muster-Analyse. Bitte weitere Szenarien
                hinzufügen.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                          {insight.title}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {insight.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function generateInsights(
  allLines: ReturnType<typeof useAllLines>,
): { title: string; body: string }[] {
  const insights: { title: string; body: string }[] = [];

  // Per-line category share and overall.
  const perLine = allLines
    .map(({ line }) => {
      const sz = getSzenarienForLine(line.id)[0];
      if (!sz || sz.events.length === 0) return null;
      const total = sz.events.length;
      const cycles = sz.cycles.length || 1;
      const counts: Record<string, number> = {};
      for (const e of sz.events) counts[e.category] = (counts[e.category] ?? 0) + 1;
      return { line, total, cycles, counts, errorRate: (total / cycles) * 100 };
    })
    .filter(Boolean) as {
    line: (typeof allLines)[number]["line"];
    total: number;
    cycles: number;
    counts: Record<string, number>;
    errorRate: number;
  }[];

  if (perLine.length < 2) return insights;

  // Insight 1: dominant category that appears above-average in multiple lines.
  const catAvgShare: Record<string, number[]> = {};
  for (const p of perLine) {
    for (const [cat, c] of Object.entries(p.counts)) {
      const share = c / p.total;
      (catAvgShare[cat] ??= []).push(share);
    }
  }
  const flagged: { cat: EventCategory; lines: number }[] = [];
  for (const [cat, shares] of Object.entries(catAvgShare)) {
    const avg = shares.reduce((a, b) => a + b, 0) / shares.length;
    const above = shares.filter((s) => s > 0.25).length;
    if (above >= 2 && avg > 0.2) {
      flagged.push({ cat: cat as EventCategory, lines: above });
    }
  }
  flagged.sort((a, b) => b.lines - a.lines);
  if (flagged.length > 0) {
    const f = flagged[0];
    const total = perLine.length;
    insights.push({
      title: "Kategorie-Cluster",
      body: `„${CATEGORY_LABELS[f.cat]}" tritt in ${f.lines} von ${total} Linien überdurchschnittlich häufig auf. Ein linienübergreifender Fix (z. B. verbesserte Slot-Markierung oder ein gemeinsamer Kontrollschritt) hätte hier den größten Hebel.`,
    });
  }

  // Insight 2: highest error rate outlier.
  const sortedByRate = [...perLine].sort((a, b) => b.errorRate - a.errorRate);
  const worst = sortedByRate[0];
  const median = sortedByRate[Math.floor(sortedByRate.length / 2)].errorRate;
  if (worst.errorRate > median * 1.5 && worst.errorRate > 8) {
    const domCat = Object.entries(worst.counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    insights.push({
      title: "Ausreißer-Linie",
      body: `„${worst.line.name}" liegt mit ${worst.errorRate.toFixed(1).replace(".", ",")} % Fehlerquote deutlich über dem Median (${median.toFixed(1).replace(".", ",")} %). Hauptursache ist „${CATEGORY_LABELS[(domCat as EventCategory) ?? "Fehlgriff"]}" – ein gezielter Deep-Dive dieser Linie ist priorisiert lohnenswert.`,
    });
  }

  // Insight 3: step concentration.
  const stepTotals: Record<string, number> = {};
  let grandTotal = 0;
  for (const p of perLine) {
    for (const [cat, c] of Object.entries(p.counts)) {
      const step = CATEGORY_TO_STEP[cat as EventCategory];
      stepTotals[step] = (stepTotals[step] ?? 0) + c;
      grandTotal += c;
    }
  }
  const topStep = Object.entries(stepTotals).sort((a, b) => b[1] - a[1])[0];
  if (topStep && grandTotal > 0 && topStep[1] / grandTotal > 0.35) {
    const pct = Math.round((topStep[1] / grandTotal) * 100);
    insights.push({
      title: "Prozessschritt-Hotspot",
      body: `${pct} % aller Fehler entstehen am Schritt „${topStep[0]}". Investition in Sensorik oder Standardisierung an genau diesem Punkt reduziert die Gesamt-Fehlerlast am schnellsten.`,
    });
  }

  // Insight 4: low-confidence review load.
  let humanChecks = 0;
  let allEvents = 0;
  for (const p of perLine) {
    const sz = getSzenarienForLine(p.line.id)[0];
    if (!sz) continue;
    humanChecks += sz.events.filter((e) => e.human_checkpoint_required).length;
    allEvents += sz.events.length;
  }
  if (allEvents > 0 && humanChecks / allEvents > 0.1) {
    const pct = Math.round((humanChecks / allEvents) * 100);
    insights.push({
      title: "Menschliche Rückfragen",
      body: `${pct} % der Ereignisse erfordern eine menschliche Rückfrage (niedrige Konfidenz + mittlere/hohe Schwere). Ein zusätzliches Trainings-Sample-Set für den Vision-Cluster senkt hier Aufwand für den Schichtführer messbar.`,
    });
  }

  return insights.slice(0, 4);
}
