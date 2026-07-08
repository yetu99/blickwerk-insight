import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Clock,
  AlertTriangle,
  PowerOff,
  Save,
  Trash2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { KpiTile } from "@/components/blickwerk/kpi-tile";
import { EventFeed } from "@/components/blickwerk/event-feed";
import {
  SzenarioVideoPlayer,
  type SzenarioVideoHandle,
} from "@/components/blickwerk/event-video-player";
import {
  LINES,
  getSeed,
  computeKpis,
  computeStepTimes,
  type Line,
  type ProcessEvent,
} from "@/lib/mock-data";
import {
  useRun,
  useDraft,
  clearDraft,
  saveDraftAsSzenario,
  useAllLines,
  useSzenarienForLine,
  setActiveSzenario,
  useActiveSzenario,
  getLine,
} from "@/lib/runs-store";
import { useT } from "@/lib/i18n";
import { VdiFlowDiagram } from "@/components/blickwerk/vdi-flow";

interface IndexSearch {
  line?: string;
  szenario?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    line: typeof search.line === "string" ? search.line : undefined,
    szenario: typeof search.szenario === "string" ? search.szenario : undefined,
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
  const t = useT();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const allLines = useAllLines();

  const [lineId, setLineId] = useState<string>(search.line ?? LINES[0].id);

  useEffect(() => {
    if (search.line && search.line !== lineId) setLineId(search.line);
  }, [search.line, lineId]);

  useEffect(() => {
    if (search.szenario) setActiveSzenario(lineId, search.szenario);
  }, [search.szenario, lineId]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const draft = useDraft();
  const runOverride = useRun(lineId);
  const activeSz = useActiveSzenario(lineId);
  const szenarien = useSzenarienForLine(lineId);

  const targetLineName = draft?.targetLineId
    ? getLine(draft.targetLineId)?.name ?? "…"
    : draft?.newLine?.name || "neuer Linie";

  const draftLine: Line | null = draft
    ? {
        id: "draft",
        name: draft.newLine?.name || targetLineName,
        location: draft.newLine?.location || "Entwurf",
        camera_id: "—",
      }
    : null;

  const activeLine: Line =
    draftLine ?? (runOverride?.line ?? getSeed(lineId).line);

  const sourceCycles = draft ? draft.cycles : (runOverride ?? getSeed(lineId)).cycles;
  const sourceEvents = draft ? draft.events : (runOverride ?? getSeed(lineId)).events;

  const cycles = mounted ? sourceCycles : [];
  const events = mounted ? sourceEvents : [];

  const kpis = computeKpis(cycles, events);
  const stepTimes = useMemo(() => computeStepTimes(cycles), [cycles]);

  const videoSrc = draft?.video.url ?? activeSz?.video?.url ?? null;
  const videoDuration = draft?.video.durationSec ?? activeSz?.video?.durationSec ?? 0;

  const playerRef = useRef<SzenarioVideoHandle>(null);
  const [selectedEvent, setSelectedEvent] = useState<ProcessEvent | null>(null);

  const handleEventClick = (e: ProcessEvent) => {
    // Toggle: same event clicked again → collapse
    setSelectedEvent((prev) => (prev?.id === e.id ? null : e));
    if (videoSrc && e.video_timestamp_start !== undefined) {
      playerRef.current?.seekTo(e);
    }
  };


  const handleSaveDraft = () => {
    if (!draft) return;
    const res = saveDraftAsSzenario();
    if (res) {
      setLineId(res.lineId);
      navigate({
        to: "/",
        search: { line: res.lineId, szenario: res.szenarioId },
      });
      const linename = getLine(res.lineId)?.name ?? "";
      toast.success(`Szenario in „${linename}" gespeichert`);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    toast("Analyse verworfen", { description: "Der Entwurf wurde entfernt." });
  };

  const draftTargetLabel = draft
    ? draft.targetLineId
      ? getLine(draft.targetLineId)?.name ?? "Linie"
      : draft.newLine?.name || "neuer Linie"
    : "";

  void allLines;
  void szenarien;

  const scenarioLabel = draft ? "Entwurf" : activeSz?.label ?? "—";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={activeLine} />

      <main className="flex-1 min-w-0 flex flex-col">
        {draft && (
          <div className="border-b border-warning/40 bg-warning/10 px-6 py-3 flex items-center justify-between gap-4 flex-wrap no-print">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {t("draft.title")}
                  <span className="text-muted-foreground font-normal">
                    {" · "}
                    {formatDurationShort(draft.video.durationSec)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t("draft.hint")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscardDraft}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("btn.discard")}
              </button>
              <button
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                {t("draft.saveAs", { line: draftTargetLabel })}
              </button>
            </div>
          </div>
        )}

        <header className="border-b border-border bg-card px-6 py-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">
              {t("page.uebersicht.title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              <span className="font-medium text-foreground/80">{activeLine.name}</span>
              <span className="mx-1.5">·</span>
              <span>{scenarioLabel}</span>
            </p>
          </div>
          <button
            onClick={() => window.print()}
            title="Im Druck-Dialog unter 'Weitere Einstellungen' die Option 'Kopf- und Fußzeilen' deaktivieren, damit URL und Seitenzahl nicht mit ausgegeben werden."
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors no-print"
          >
            <Printer className="h-3.5 w-3.5" />
            Export (PDF)
          </button>

        </header>

        <div className="flex-1 p-6 space-y-6">
          {/* 1. Process flow diagram */}
          <section className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Prozessablauf
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gemessene Zeitspanne je Prozessschritt aus dem aktiven Szenario
              </p>
            </div>
            <VdiFlowDiagram stepTimes={stepTimes} />
          </section>

          {/* 2. Video (wide, left) + KPI 2x2 (right) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-[var(--shadow-card)] p-5">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Szenario-Video
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scenarioLabel} · Ereignis-Marker sind klickbar
                </p>
              </div>
              <SzenarioVideoPlayer
                ref={playerRef}
                src={videoSrc}
                videoDuration={videoDuration}
                events={events}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 content-start">
              <KpiTile
                label={t("kpi.throughput")}
                value={kpis.throughput.toString()}
                unit={t("kpi.throughputUnit")}
                icon={Activity}
                trend={{ direction: "up", value: "+4,2 %", positive: true }}
              />
              <KpiTile
                label={t("kpi.avgCycle")}
                value={kpis.avgCycle.toFixed(2).replace(".", ",")}
                unit={t("kpi.cycleUnit")}
                icon={Clock}
                trend={{ direction: "down", value: "−0,3 s", positive: true }}
              />
              <KpiTile
                label={t("kpi.errorRate")}
                value={kpis.errorRate.toFixed(1).replace(".", ",")}
                unit="%"
                icon={AlertTriangle}
                trend={{ direction: "up", value: "+1,8 %", positive: false }}
              />
              <KpiTile
                label={t("kpi.downtime")}
                value={kpis.downtimeMin.toFixed(1).replace(".", ",")}
                unit={t("kpi.downtimeUnit")}
                icon={PowerOff}
                trend={{ direction: "down", value: "−2,1 min", positive: true }}
              />
            </div>
          </section>

          {/* 3. Event feed — full width */}
          <section>
            <EventFeed
              events={events}
              onEventClick={handleEventClick}
              selectedEventId={selectedEvent?.id ?? null}
            />
          </section>

        </div>
      </main>
    </div>
  );
}
