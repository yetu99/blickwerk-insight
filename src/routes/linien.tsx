import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Factory, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { LINES, computeKpis, getSeed } from "@/lib/mock-data";
import { useAllLines, useRun } from "@/lib/runs-store";

export const Route = createFileRoute("/linien")({
  head: () => ({
    meta: [
      { title: "Linien – symplify" },
      {
        name: "description",
        content:
          "Übersicht aller analysierten Fertigungslinien mit Ø Taktzeit und Fehlerquote.",
      },
    ],
  }),
  component: LinienPage,
});

function formatRelative(nowMs: number, thenMs: number | null): string {
  if (thenMs === null) return "seit Projektstart";
  const diff = Math.max(0, nowMs - thenMs);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `gespeichert vor ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `gespeichert vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `gespeichert vor ${h} Std.`;
  const d = Math.floor(h / 24);
  return `gespeichert vor ${d} Tg.`;
}

function LinienPage() {
  const allLines = useAllLines();

  const [now, setNow] = useState<number>(0);
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
            {allLines.length} analysierte Prozesse · Klick öffnet die Übersicht
          </p>
        </header>

        <div className="flex-1 p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allLines.map(({ line, savedAt }) => (
              <li key={line.id}>
                <LineCard
                  lineId={line.id}
                  name={line.name}
                  location={line.location}
                  cameraId={line.camera_id}
                  savedAt={savedAt}
                  now={now}
                />
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

function LineCard({
  lineId,
  name,
  location,
  cameraId,
  savedAt,
  now,
}: {
  lineId: string;
  name: string;
  location: string;
  cameraId: string;
  savedAt: number | null;
  now: number;
}) {
  const runOverride = useRun(lineId);
  const seed = runOverride ?? (savedAt === null ? getSeed(lineId) : undefined);
  const kpis = seed ? computeKpis(seed.cycles, seed.events) : null;
  const isNew = savedAt !== null;

  return (
    <Link
      to="/"
      search={{ line: lineId }}
      className="block group rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Factory className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
            {isNew && (
              <span className="text-[9px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded px-1 py-0.5 shrink-0">
                Neu
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {location} · {cameraId}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
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
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {kpis ? kpis.errorRate.toFixed(1).replace(".", ",") : "—"}
            <span className="text-[11px] font-normal text-muted-foreground ml-1">
              %
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {now === 0 && isNew ? "gerade gespeichert" : formatRelative(now, savedAt)}
      </div>
    </Link>
  );
}
