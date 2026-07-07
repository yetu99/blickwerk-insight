import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, AlertTriangle, Film, Play } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { LINES, computeKpis } from "@/lib/mock-data";
import { useAllLines, useSzenarienForLine } from "@/lib/runs-store";

export const Route = createFileRoute("/linien/$lineId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.lineId} – Szenarien – symplify` },
      { name: "description", content: "Szenarien-Übersicht für eine Linie." },
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

function LineDetail() {
  const { lineId } = Route.useParams();
  const allLines = useAllLines();
  const item = allLines.find((l) => l.line.id === lineId);
  const line = item?.line;
  const szenarien = useSzenarienForLine(lineId);

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
          <h1 className="text-lg font-semibold text-foreground">
            {line?.name ?? lineId}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {line?.location} · {szenarien.length} Szenarien (neueste zuerst)
          </p>
        </header>

        <div className="flex-1 p-6">
          {szenarien.length === 0 ? (
            <div className="max-w-md mx-auto text-center rounded-xl border border-dashed border-border bg-card p-10">
              <Film className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                Noch keine Szenarien
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lade ein Video über „Neue Analyse" hoch, um das erste Szenario
                anzulegen.
              </p>
              <Link
                to="/neue-analyse"
                className="inline-flex items-center gap-1.5 mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Neue Analyse starten
              </Link>
            </div>
          ) : (
            <ol className="space-y-3 max-w-4xl">
              {szenarien.map((sz, idx) => {
                const kpis = computeKpis(sz.cycles, sz.events);
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
                              {fmt(sz.createdAt)} · {sz.cycles.length} Zyklen ·{" "}
                              {sz.events.length} Ereignisse
                              {sz.video && (
                                <>
                                  {" · Video "}
                                  {Math.round(sz.video.durationSec)}s
                                </>
                              )}
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
                              {kpis.avgCycle.toFixed(2).replace(".", ",")} s
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                              <AlertTriangle className="h-3 w-3" />
                              Fehler
                            </div>
                            <div className="text-sm font-semibold tabular-nums">
                              {kpis.errorRate.toFixed(1).replace(".", ",")} %
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}
