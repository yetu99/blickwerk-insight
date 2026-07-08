import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory, Clock, AlertTriangle, ArrowRight, Layers } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { LINES, computeKpis } from "@/lib/mock-data";
import { useAllLines } from "@/lib/runs-store";

export const Route = createFileRoute("/linien/")({
  head: () => ({
    meta: [
      { title: "Linien – symplify" },
      {
        name: "description",
        content:
          "Übersicht aller Fertigungslinien mit Anzahl Szenarien und aktueller KPI-Vorschau.",
      },
    ],
  }),
  component: LinienPage,
});

function formatRelative(nowMs: number, thenMs: number): string {
  if (!thenMs) return "—";
  const diff = Math.max(0, nowMs - thenMs);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `vor ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tg.`;
}

function LinienPage() {
  const allLines = useAllLines();
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={LINES[0]} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Linien</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allLines.length} Fertigungslinien · Klick öffnet die Szenarien
          </p>
        </header>

        <div className="flex-1 p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allLines.map(({ line, savedAt, szenarienCount, latestSzenario }) => {
              const kpis = latestSzenario
                ? computeKpis(latestSzenario.cycles, latestSzenario.events)
                : null;
              const isNew = savedAt !== null;
              return (
                <li key={line.id}>
                  <Link
                    to="/linien/$lineId"
                    params={{ lineId: line.id }}
                    className="block group rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Factory className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {line.name}
                          </h3>
                          {isNew && (
                            <span className="text-[9px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded px-1 py-0.5 shrink-0">
                              Neu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {line.location} · {line.camera_id}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Layers className="h-3.5 w-3.5" />
                      <span>
                        {szenarienCount} Szenarien
                        {latestSzenario && (
                          <>
                            {" · zuletzt "}
                            {formatRelative(now, latestSzenario.createdAt)}
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-muted/40 border border-border p-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          Ø Taktzeit
                        </div>
                        <div className="text-lg font-semibold tabular-nums text-foreground">
                          {kpis ? kpis.avgCycle.toFixed(2).replace(".", ",") : "—"}
                          <span className="text-[11px] font-normal text-muted-foreground ml-1">
                            s
                          </span>
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/40 border border-border p-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                          <AlertTriangle className="h-3 w-3" />
                          Fehlerquote
                        </div>
                        <div
                          className="text-lg font-semibold tabular-nums"
                          style={{
                            color: kpis
                              ? kpis.errorRate >= 15
                                ? "var(--destructive)"
                                : kpis.errorRate >= 10
                                  ? "var(--warning)"
                                  : "var(--success)"
                              : "var(--foreground)",
                          }}
                        >
                          {kpis ? kpis.errorRate.toFixed(1).replace(".", ",") : "—"}
                          <span className="text-[11px] font-normal text-muted-foreground ml-1">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {kpis && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Status</span>
                          <span>
                            {kpis.errorRate >= 15
                              ? "Kritisch"
                              : kpis.errorRate >= 10
                                ? "Beobachten"
                                : "Stabil"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, kpis.errorRate * 4)}%`,
                              backgroundColor:
                                kpis.errorRate >= 15
                                  ? "var(--destructive)"
                                  : kpis.errorRate >= 10
                                    ? "var(--warning)"
                                    : "var(--success)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}

