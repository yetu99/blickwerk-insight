import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, Clock, AlertTriangle, PowerOff, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  type Line,
  type RangePresetId,
} from "@/lib/mock-data";
import {
  useRun,
  useDraft,
  clearDraft,
  saveDraftAsLine,
  setVideo,
} from "@/lib/runs-store";

interface IndexSearch {
  line?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    line: typeof search.line === "string" ? search.line : undefined,
  }),
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
        content:
          "Live-Dashboard für Zykluszeiten, Fehler und Stillstandzeiten im Mittelstand.",
      },
    ],
  }),
  component: Dashboard,
});

function formatDurationShort(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")} min`;
}

function Dashboard() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [lineId, setLineId] = useState<string>(search.line ?? LINES[0].id);
  const [presetId, setPresetId] = useState<RangePresetId>("2h");

  // React to ?line= changes (e.g. from the Linien page).
  useEffect(() => {
    if (search.line && search.line !== lineId) setLineId(search.line);
  }, [search.line, lineId]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const draft = useDraft();
  const runOverride = useRun(lineId);

  // Draft takes precedence over the currently selected saved line.
  const draftLine: Line | null = draft
    ? {
        id: "draft",
        name: draft.processName || "Neuer Prozess",
        location: draft.location || "Entwurf",
        camera_id: "—",
      }
    : null;

  const activeLine: Line = draftLine ?? (runOverride?.line ?? getSeed(lineId).line);

  const sourceCycles = draft ? draft.cycles : (runOverride ?? getSeed(lineId)).cycles;
  const sourceEvents = draft ? draft.events : (runOverride ?? getSeed(lineId)).events;

  const range = useMemo(
    () => (RANGE_PRESETS.find((p) => p.id === presetId) ?? RANGE_PRESETS[0]).compute(),
    [presetId, mounted],
  );

  const cycles = useMemo(
    () => (mounted ? filterByRange(sourceCycles, range.from, range.to) : []),
    [sourceCycles, range.from, range.to, mounted],
  );
  const events = useMemo(
    () => (mounted ? filterByRange(sourceEvents, range.from, range.to) : []),
    [sourceEvents, range.from, range.to, mounted],
  );

  const kpis = computeKpis(cycles, events);
  const rangeLabel = RANGE_PRESETS.find((p) => p.id === presetId)?.label ?? "";

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

  // While a draft is active, the event dialog reads the video via lineId.
  // Mirror the draft video onto the temporary "draft" line id so playback works.
  useEffect(() => {
    if (draft) {
      setVideo("draft", draft.video);
    }
  }, [draft]);

  const handleSaveDraft = () => {
    if (!draft) return;
    const name = draft.processName;
    const newId = saveDraftAsLine();
    if (newId) {
      setLineId(newId);
      navigate({ to: "/", search: { line: newId } });
      toast.success(`Linie „${name}" gespeichert`);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    toast("Analyse verworfen", { description: "Der Entwurf wurde entfernt." });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={activeLine} />

      <main className="flex-1 min-w-0 flex flex-col">
        {draft && (
          <div className="border-b border-warning/40 bg-warning/10 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  Ungespeicherte Analyse: {draft.processName || "Neuer Prozess"}
                  <span className="text-muted-foreground font-normal">
                    {" · "}
                    {formatDurationShort(draft.video.durationSec)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Speichere den Entwurf als Linie, damit er in der Linien-Übersicht
                  erscheint.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscardDraft}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Verwerfen
              </button>
              <button
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Als neue Linie speichern
              </button>
            </div>
          </div>
        )}

        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Übersicht</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live-Analyse · {rangeLabel}
              {nowLabel && <> · {nowLabel}</>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!draft && (
              <HeaderControls
                lineId={lineId}
                onLineChange={(id) => {
                  setLineId(id);
                  navigate({ to: "/", search: { line: id } });
                }}
                presetId={presetId}
                onPresetChange={setPresetId}
              />
            )}
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
