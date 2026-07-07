import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock, AlertTriangle, PowerOff } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { HeaderControls } from "@/components/blickwerk/header-controls";
import { KpiTile } from "@/components/blickwerk/kpi-tile";
import { CycleTimeChart } from "@/components/blickwerk/cycle-time-chart";
import { CategoryDistribution } from "@/components/blickwerk/category-distribution";
import { EventFeed } from "@/components/blickwerk/event-feed";
import { ChatPanel } from "@/components/blickwerk/chat-panel";
import {
  LINES,
  RANGE_PRESETS,
  getSeed,
  computeKpis,
  filterByRange,
  type RangePresetId,
} from "@/lib/mock-data";
import { useRun } from "@/lib/runs-store";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "symplify – Prozess-Intelligenz für die Fertigung" },
      {
        name: "description",
        content:
          "Kontinuierliches, kamerabasiertes Qualitäts-Dashboard für Fertigungslinien. Zykluszeiten, Fehlerereignisse und Prozesskategorien auf einen Blick.",
      },
      { property: "og:title", content: "symplify – Prozess-Intelligenz" },
      {
        property: "og:description",
        content: "Live-Dashboard für Zykluszeiten, Fehler und Stillstandzeiten im Mittelstand.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [lineId, setLineId] = useState<string>(LINES[0].id);
  const [presetId, setPresetId] = useState<RangePresetId>("2h");

  const runOverride = useRun(lineId);
  const seed = runOverride ?? getSeed(lineId);
  const range = useMemo(
    () => (RANGE_PRESETS.find((p) => p.id === presetId) ?? RANGE_PRESETS[0]).compute(),
    [presetId],
  );

  const cycles = useMemo(
    () => filterByRange(seed.cycles, range.from, range.to),
    [seed.cycles, range.from, range.to],
  );
  const events = useMemo(
    () => filterByRange(seed.events, range.from, range.to),
    [seed.events, range.from, range.to],
  );

  const kpis = computeKpis(cycles, events);
  const activeLine = seed.line;

  const rangeLabel = RANGE_PRESETS.find((p) => p.id === presetId)?.label ?? "";

  // Client-only timestamp avoids SSR/CSR TZ hydration mismatch.
  const [nowLabel, setNowLabel] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    setNowLabel(fmt());
    const t = setInterval(() => setNowLabel(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);


  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={activeLine} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Übersicht</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live-Analyse · {rangeLabel} ·{" "}
              {now.toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HeaderControls
              lineId={lineId}
              onLineChange={setLineId}
              presetId={presetId}
              onPresetChange={setPresetId}
            />
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Kamera aktiv
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiTile
              label="Durchsatz"
              value={kpis.throughput.toString()}
              unit="Einheiten/min"
              icon={Activity}
              trend={{ direction: "up", value: "+4,2 % ggü. Vortag", positive: true }}
            />
            <KpiTile
              label="Ø Taktzeit"
              value={kpis.avgCycle.toFixed(2).replace(".", ",")}
              unit="Sekunden"
              icon={Clock}
              trend={{ direction: "down", value: "−0,3 s ggü. Vortag", positive: true }}
              hint="Ziel: 5,0 s"
            />
            <KpiTile
              label="Fehlerquote"
              value={kpis.errorRate.toFixed(1).replace(".", ",")}
              unit="%"
              icon={AlertTriangle}
              trend={{ direction: "up", value: "+1,8 % ggü. Vortag", positive: false }}
              hint="Ziel: < 10 %"
            />
            <KpiTile
              label="Stillstandzeit"
              value={kpis.downtimeMin.toFixed(1).replace(".", ",")}
              unit="Minuten"
              icon={PowerOff}
              trend={{ direction: "down", value: "−2,1 min ggü. Vortag", positive: true }}
            />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CycleTimeChart cycles={cycles} />
            </div>
            <CategoryDistribution events={events} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EventFeed events={events} />
            </div>
            <ChatPanel />
          </section>
        </div>
      </main>
    </div>
  );
}
