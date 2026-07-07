import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Clock,
  AlertTriangle,
  PowerOff,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { HeaderControls } from "@/components/blickwerk/header-controls";
import { KpiTile } from "@/components/blickwerk/kpi-tile";
import { CycleTimeChart } from "@/components/blickwerk/cycle-time-chart";
import { CategoryDistribution } from "@/components/blickwerk/category-distribution";
import { EventFeed } from "@/components/blickwerk/event-feed";
import { ChatPanel } from "@/components/blickwerk/chat-panel";
import {
  SzenarioVideoPlayer,
  type SzenarioVideoHandle,
} from "@/components/blickwerk/event-video-player";
import {
  LINES,
  RANGE_PRESETS,
  getSeed,
  computeKpis,
  filterByRange,
  type Line,
  type ProcessEvent,
  type RangePresetId,
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

  const [presetId, setPresetId] = useState<RangePresetId>("2h");

  useEffect(() => {
    if (search.line && search.line !== lineId) setLineId(search.line);
  }, [search.line, lineId]);

  // Sync active szenario for a line from URL if provided.
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

  // Video: from draft or active szenario.
  const videoSrc = draft?.video.url ?? activeSz?.video?.url ?? null;
  const videoDuration = draft?.video.durationSec ?? activeSz?.video?.durationSec ?? 0;

  const playerRef = useRef<SzenarioVideoHandle>(null);
  const handleEventClick = (e: ProcessEvent) => {
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

  // Keep line list reactive (used for validation of URL).
  void allLines;
  void szenarien;

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

        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {t("page.uebersicht.title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("page.uebersicht.subtitle")} · {rangeLabel}
              {nowLabel && <> · {nowLabel}</>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!draft && (
              <HeaderControls
                lineId={lineId}
                szenarioId={activeSz?.id}
                onSelect={(l, s) => {
                  setLineId(l);
                  setActiveSzenario(l, s);
                  navigate({ to: "/", search: { line: l, szenario: s } });
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
              label={t("kpi.throughput")}
              value={kpis.throughput.toString()}
              unit={t("kpi.throughputUnit")}
              icon={Activity}
              trend={{ direction: "up", value: "+4,2 % ggü. Vortag", positive: true }}
            />
            <KpiTile
              label={t("kpi.avgCycle")}
              value={kpis.avgCycle.toFixed(2).replace(".", ",")}
              unit={t("kpi.cycleUnit")}
              icon={Clock}
              trend={{ direction: "down", value: "−0,3 s ggü. Vortag", positive: true }}
              hint="Ziel: 5,0 s"
            />
            <KpiTile
              label={t("kpi.errorRate")}
              value={kpis.errorRate.toFixed(1).replace(".", ",")}
              unit="%"
              icon={AlertTriangle}
              trend={{ direction: "up", value: "+1,8 % ggü. Vortag", positive: false }}
              hint="Ziel: < 10 %"
            />
            <KpiTile
              label={t("kpi.downtime")}
              value={kpis.downtimeMin.toFixed(1).replace(".", ",")}
              unit={t("kpi.downtimeUnit")}
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
            <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-[var(--shadow-card)] p-5">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Szenario-Video
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeSz?.label ?? "—"} · Ereignis-Marker sind klickbar
                </p>
              </div>
              <SzenarioVideoPlayer
                ref={playerRef}
                src={videoSrc}
                videoDuration={videoDuration}
                events={events}
              />
            </div>
            <ChatPanel />
          </section>

          <section>
            <EventFeed events={events} onEventClick={handleEventClick} />
          </section>
        </div>
      </main>
    </div>
  );
}
