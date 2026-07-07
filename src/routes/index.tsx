import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock, AlertTriangle, PowerOff, ChevronDown } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { KpiTile } from "@/components/blickwerk/kpi-tile";
import { CycleTimeChart } from "@/components/blickwerk/cycle-time-chart";
import { CategoryDistribution } from "@/components/blickwerk/category-distribution";
import { EventFeed } from "@/components/blickwerk/event-feed";
import { ChatPanel } from "@/components/blickwerk/chat-panel";
import { SEED, computeKpis, LINE } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlickWerk – Prozess-Intelligenz für die Fertigung" },
      {
        name: "description",
        content:
          "Kontinuierliches, kamerabasiertes Qualitäts-Dashboard für Fertigungslinien. Zykluszeiten, Fehlerereignisse und Prozesskategorien auf einen Blick.",
      },
      { property: "og:title", content: "BlickWerk – Prozess-Intelligenz" },
      {
        property: "og:description",
        content: "Live-Dashboard für Zykluszeiten, Fehler und Stillstandzeiten im Mittelstand.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const kpis = computeKpis(SEED.cycles, SEED.events);
  const now = new Date();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Übersicht</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live-Analyse · letzte 2 Stunden ·{" "}
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
            <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-primary/50">
              {LINE.name}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Kamera aktiv
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* KPI Row */}
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

          {/* Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CycleTimeChart cycles={SEED.cycles} />
            </div>
            <CategoryDistribution events={SEED.events} />
          </section>

          {/* Bottom Row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <EventFeed events={SEED.events} />
            </div>
            <ChatPanel />
          </section>
        </div>
      </main>
    </div>
  );
}
