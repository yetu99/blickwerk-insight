import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  Film,
  Play,
  Bot,
  Sparkles,
  TrendingUp,
  Wrench,
  Eye,
  Zap,
} from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import {
  LINES,
  computeKpis,
  CATEGORY_LABELS,
  CATEGORY_TO_STEP,
  type EventCategory,
  type ProcessEvent,
} from "@/lib/mock-data";
import { useAllLines, useSzenarienForLine } from "@/lib/runs-store";

export const Route = createFileRoute("/linien/$lineId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.lineId} – Detailansicht – symplify` },
      { name: "description", content: "Detailansicht einer Linie mit Fehleranalyse und Automatisierungspotenzial." },
    ],
  }),
  component: LineDetail,
});

function fmt(ts: number) {
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CategoryStat {
  category: EventCategory;
  count: number;
  pct: number;
  high: number;
  medium: number;
  low: number;
  step: string;
  checkpoints: number;
}

function analyzeEvents(events: ProcessEvent[]): CategoryStat[] {
  const total = events.length || 1;
  const map = new Map<EventCategory, CategoryStat>();
  for (const e of events) {
    let s = map.get(e.category);
    if (!s) {
      s = {
        category: e.category,
        count: 0,
        pct: 0,
        high: 0,
        medium: 0,
        low: 0,
        step: CATEGORY_TO_STEP[e.category],
        checkpoints: 0,
      };
      map.set(e.category, s);
    }
    s.count++;
    s[e.severity]++;
    if (e.human_checkpoint_required) s.checkpoints++;
  }
  const arr = Array.from(map.values());
  for (const s of arr) s.pct = (s.count / total) * 100;
  arr.sort((a, b) => b.count - a.count);
  return arr;
}

interface Suggestion {
  id: string;
  title: string;
  detail: string;
  impact: "hoch" | "mittel" | "niedrig";
  effort: "gering" | "mittel" | "hoch";
  automatable: boolean;
  category: EventCategory;
}

const SUGGESTION_TEMPLATES: Record<EventCategory, Omit<Suggestion, "id" | "impact" | "category">> = {
  Farbverwechslung: {
    title: "Farbklassifikator vor Greifer nachschalten",
    detail:
      "RGB-Sensor an Position vor dem Greifarm ergänzt die Kamera und blockt falsche Farbchargen, bevor sie in den Kasten wandern.",
    effort: "mittel",
    automatable: true,
  },
  Fehlgriff: {
    title: "Greiferposition per Vision-Feedback nachregeln",
    detail:
      "Live-Positionskorrektur (±2 mm) vor jedem Greifzyklus reduziert Fehlpositionierungen und Zweitversuche deutlich.",
    effort: "mittel",
    automatable: true,
  },
  Taktzeitueberschreitung: {
    title: "Puffer vor Kontrollstation vergrößern",
    detail:
      "Zusätzlicher Pufferplatz (2 Slots) entkoppelt Taktschwankungen der Kontrollstation von der Linie stromaufwärts.",
    effort: "gering",
    automatable: false,
  },
  Zoegern: {
    title: "Anzeige-Layout am Bedienplatz umstellen",
    detail:
      "Kritische KPIs direkt in Blickachse (statt seitlicher Monitor) — verkürzt Blickwechselzeit und eliminiert das Zögern-Muster.",
    effort: "gering",
    automatable: false,
  },
  Prozessunterbrechung: {
    title: "Automatischer Wiederanlauf nach Kurzstopp",
    detail:
      "SPS-Routine erkennt Kurzstopps <30 s und fährt die Station selbstständig wieder an, sofern keine Sicherheitsverriegelung aktiv ist.",
    effort: "hoch",
    automatable: true,
  },
};

function suggestionsFrom(stats: CategoryStat[]): Suggestion[] {
  return stats.slice(0, 5).map((s, i) => {
    const tmpl = SUGGESTION_TEMPLATES[s.category];
    const impact: Suggestion["impact"] =
      s.pct >= 30 ? "hoch" : s.pct >= 15 ? "mittel" : "niedrig";
    return {
      id: `${s.category}-${i}`,
      category: s.category,
      impact,
      ...tmpl,
    };
  });
}

const CATEGORY_COLOR: Record<EventCategory, string> = {
  Fehlgriff: "var(--chart-2)",
  Farbverwechslung: "var(--chart-4)",
  Taktzeitueberschreitung: "var(--chart-3)",
  Zoegern: "var(--chart-1)",
  Prozessunterbrechung: "var(--chart-5)",
};

function LineDetail() {
  const { lineId } = Route.useParams();
  const allLines = useAllLines();
  const item = allLines.find((l) => l.line.id === lineId);
  const line = item?.line;
  const szenarien = useSzenarienForLine(lineId);
  const latest = szenarien[0];

  const stats = useMemo(() => (latest ? analyzeEvents(latest.events) : []), [latest]);
  const suggestions = useMemo(() => suggestionsFrom(stats), [stats]);
  const kpis = latest ? computeKpis(latest.cycles, latest.events) : null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={line ?? LINES[0]} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <Link
            to="/linien"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zur Linien-Übersicht
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground">
                {line?.name ?? lineId}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {line?.location} · {line?.camera_id} · {szenarien.length} Szenarien
              </p>
            </div>
            {kpis && (
              <div className="flex items-center gap-4">
                <MiniKpi label="Ø Taktzeit" value={`${kpis.avgCycle.toFixed(2).replace(".", ",")} s`} />
                <MiniKpi
                  label="Fehlerquote"
                  value={`${kpis.errorRate.toFixed(1).replace(".", ",")} %`}
                  accent={kpis.errorRate >= 15 ? "bad" : kpis.errorRate >= 10 ? "warn" : "ok"}
                />
                <MiniKpi label="Durchsatz" value={`${kpis.throughput.toFixed(1).replace(".", ",")}/min`} />
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {!latest ? (
            <div className="max-w-md mx-auto text-center rounded-xl border border-dashed border-border bg-card p-10">
              <Film className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Noch keine Szenarien</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lade ein Video über „Neue Analyse" hoch, um das erste Szenario anzulegen.
              </p>
              <Link
                to="/neue-analyse"
                className="inline-flex items-center gap-1.5 mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Neue Analyse starten
              </Link>
            </div>
          ) : (
            <>
              {/* Fehleranalyse + Verbesserungspotential side by side */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Fehleranalyse */}
                <section className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h2 className="text-sm font-semibold text-foreground">Fehleranalyse</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {latest.events.length} Ereignisse aus {latest.cycles.length} Zyklen · gruppiert nach Ursache
                  </p>
                  <ul className="space-y-3">
                    {stats.map((s) => {
                      const color = CATEGORY_COLOR[s.category];
                      return (
                        <li key={s.category} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-medium text-foreground truncate">
                                {CATEGORY_LABELS[s.category]}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                {s.step}
                              </span>
                            </div>
                            <div className="tabular-nums text-foreground font-semibold">
                              {s.count}
                              <span className="text-muted-foreground font-normal ml-1">
                                · {s.pct.toFixed(0)} %
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s.pct}%`, backgroundColor: color }}
                            />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>
                              Hoch <span className="text-destructive font-medium">{s.high}</span>
                            </span>
                            <span>
                              Mittel <span className="text-warning font-medium">{s.medium}</span>
                            </span>
                            <span>Niedrig {s.low}</span>
                            {s.checkpoints > 0 && (
                              <span className="ml-auto text-[10px] text-warning">
                                {s.checkpoints}× Rückfrage nötig
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    {stats.length === 0 && (
                      <li className="text-xs text-muted-foreground">Keine Ereignisse im aktuellen Szenario.</li>
                    )}
                  </ul>
                </section>

                {/* Verbesserungs-/Automatisierungspotential */}
                <section className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Verbesserungs- & Automatisierungspotenzial
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Priorisierte Handlungsempfehlungen abgeleitet aus der Fehleranalyse
                  </p>
                  <ol className="space-y-3">
                    {suggestions.map((s, i) => (
                      <li
                        key={s.id}
                        className="rounded-lg border border-border bg-background/40 p-3 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold grid place-items-center">
                              {i + 1}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-sm font-medium text-foreground">{s.title}</h3>
                              {s.automatable ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                                  <Bot className="h-3 w-3" />
                                  Automatisierbar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  <Wrench className="h-3 w-3" />
                                  Manuell
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {s.detail}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-[10px]">
                              <ImpactBadge impact={s.impact} />
                              <span className="text-muted-foreground">
                                Aufwand: <span className="text-foreground font-medium">{s.effort}</span>
                              </span>
                              <span className="text-muted-foreground truncate">
                                Adressiert: {CATEGORY_LABELS[s.category]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                    {suggestions.length === 0 && (
                      <li className="text-xs text-muted-foreground">
                        Keine Auffälligkeiten — keine Empfehlungen nötig.
                      </li>
                    )}
                  </ol>
                </section>
              </div>

              {/* Szenarien */}
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Szenarien <span className="text-muted-foreground font-normal">({szenarien.length} · neueste zuerst)</span>
                </h2>
                <ol className="space-y-3">
                  {szenarien.map((sz, idx) => {
                    const k = computeKpis(sz.cycles, sz.events);
                    return (
                      <li key={sz.id}>
                        <Link
                          to="/"
                          search={{ line: lineId, szenario: sz.id }}
                          className="block rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] hover:border-primary/50 transition-colors group"
                        >
                          <div className="flex items-start gap-4 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Play className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">
                                  {sz.label}
                                  {idx === 0 && (
                                    <span className="ml-2 text-[9px] uppercase tracking-wider text-success bg-success/10 border border-success/30 rounded px-1 py-0.5">
                                      Neueste
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {fmt(sz.createdAt)} · {sz.cycles.length} Zyklen · {sz.events.length} Ereignisse
                                  {sz.video && <> · Video {Math.round(sz.video.durationSec)}s</>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                                  <Clock className="h-3 w-3" />
                                  Taktzeit
                                </div>
                                <div className="text-sm font-semibold tabular-nums">
                                  {k.avgCycle.toFixed(2).replace(".", ",")} s
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                                  <AlertTriangle className="h-3 w-3" />
                                  Fehler
                                </div>
                                <div className="text-sm font-semibold tabular-nums">
                                  {k.errorRate.toFixed(1).replace(".", ",")} %
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "ok" | "warn" | "bad";
}) {
  const color =
    accent === "bad"
      ? "var(--destructive)"
      : accent === "warn"
        ? "var(--warning)"
        : accent === "ok"
          ? "var(--success)"
          : "var(--foreground)";
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: "hoch" | "mittel" | "niedrig" }) {
  const cfg =
    impact === "hoch"
      ? { icon: Zap, color: "var(--destructive)", label: "Impact hoch" }
      : impact === "mittel"
        ? { icon: TrendingUp, color: "var(--warning)", label: "Impact mittel" }
        : { icon: Eye, color: "var(--muted-foreground)", label: "Impact niedrig" };
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium"
      style={{
        color: cfg.color,
        borderColor: `color-mix(in oklab, ${cfg.color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${cfg.color} 12%, transparent)`,
      }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}
