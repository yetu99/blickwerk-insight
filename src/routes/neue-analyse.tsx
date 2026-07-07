import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Upload as UploadIcon,
  Film,
  Check,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { Progress } from "@/components/ui/progress";
import { LINES, generateRun } from "@/lib/mock-data";
import { setDraft, useAllLines } from "@/lib/runs-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/neue-analyse")({
  head: () => ({
    meta: [
      { title: "Neue Analyse – symplify" },
      {
        name: "description",
        content:
          "Video hochladen und eine neue Prozess-Analyse als Entwurf erstellen.",
      },
    ],
  }),
  component: NeueAnalyse,
});

const STAGES = [
  "Cluster 0 – Video-Zusammenfassung wird erstellt...",
  "Cluster 1+2 – Stillstand & TIMWOODS-Analyse...",
  "Cluster 3 – Produktionserfassung & Dokumentation...",
  "Cluster 4 – Qualitätssicherung...",
  "Ergebnisse werden aufbereitet...",
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")} min`;
}

interface PreparedFile {
  file: File;
  url: string;
  durationSec: number;
}

const NEW_LINE_SENTINEL = "__new__";

function NeueAnalyse() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<PreparedFile | null>(null);
  const [probing, setProbing] = useState(false);
  const allLines = useAllLines();

  const [targetLineId, setTargetLineId] = useState<string>(
    allLines[0]?.line.id ?? NEW_LINE_SENTINEL,
  );
  const [newLineName, setNewLineName] = useState("");
  const [newLineLocation, setNewLineLocation] = useState("");
  const [label, setLabel] = useState("");

  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);

  const sidebarLine = LINES[0];

  useEffect(() => {
    if (!running) return;
    if (stage >= STAGES.length) {
      if (!prepared) return;
      const seed = generateRun("draft", prepared.durationSec);
      setDraft({
        targetLineId: targetLineId === NEW_LINE_SENTINEL ? null : targetLineId,
        newLine:
          targetLineId === NEW_LINE_SENTINEL
            ? {
                name: newLineName.trim() || "Neue Linie",
                location: newLineLocation.trim(),
              }
            : null,
        label: label.trim(),
        cycles: seed.cycles,
        events: seed.events,
        video: {
          url: prepared.url,
          durationSec: prepared.durationSec,
          filename: prepared.file.name,
          sizeBytes: prepared.file.size,
        },
        createdAt: Date.now(),
      });
      const t = setTimeout(() => navigate({ to: "/" }), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 1700);
    return () => clearTimeout(t);
  }, [
    running,
    stage,
    navigate,
    prepared,
    targetLineId,
    newLineName,
    newLineLocation,
    label,
  ]);

  const onSelectFile = (f: File | null) => {
    if (!f) return;
    if (!/\.(mp4|mov|m4v|quicktime)$/i.test(f.name) && !f.type.startsWith("video/")) {
      return;
    }
    setProbing(true);
    const url = URL.createObjectURL(f);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };
    video.onloadedmetadata = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 60;
      setPrepared({ file: f, url, durationSec: duration });
      setProbing(false);
      cleanup();
    };
    video.onerror = () => {
      setPrepared({ file: f, url, durationSec: 60 });
      setProbing(false);
      cleanup();
    };
  };

  const clearFile = () => {
    if (prepared) {
      try { URL.revokeObjectURL(prepared.url); } catch { /* noop */ }
    }
    setPrepared(null);
  };

  const isNewLine = targetLineId === NEW_LINE_SENTINEL;
  const canStart =
    !!prepared &&
    (!isNewLine || newLineName.trim().length > 0);

  const start = () => {
    if (!canStart) return;
    setStage(0);
    setRunning(true);
  };

  const progress = running ? Math.min(100, (stage / STAGES.length) * 100) : 0;

  const selectedLineLabel = isNewLine
    ? "+ Neue Linie anlegen"
    : allLines.find((l) => l.line.id === targetLineId)?.line.name ?? "Linie wählen";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={sidebarLine} />

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Neue Analyse</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Video hochladen und Prozess-Analyse starten
          </p>
        </header>

        <div className="flex-1 p-6">
          {!running ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  1. Video auswählen
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  MP4 oder MOV, max. eine Datei pro Analyse.
                </p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    onSelectFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  onClick={() => inputRef.current?.click()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors p-8 text-center ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-primary/50"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,.mp4,.mov"
                    className="hidden"
                    onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
                  />
                  {prepared ? (
                    <div className="flex items-center justify-center gap-3">
                      <Film className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-foreground">
                          {prepared.file.name}
                          <span className="text-muted-foreground font-normal">
                            {" · "}
                            {formatDuration(prepared.durationSec)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatSize(prepared.file.size)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="ml-3 p-1 rounded hover:bg-muted"
                        aria-label="Datei entfernen"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : probing ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Video-Metadaten werden gelesen...
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="h-8 w-8 text-muted-foreground/70 mx-auto mb-2" />
                      <p className="text-sm text-foreground">
                        Video hierher ziehen oder klicken zum Auswählen
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Unterstützt: .mp4, .mov
                      </p>
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  2. Linie und Szenario
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Das Video wird als neues Szenario zu einer bestehenden Linie
                  hinzugefügt – oder du legst eine neue Linie an.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Linie <span className="text-destructive">*</span>
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-full inline-flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-primary/50 transition-colors">
                          <span className="truncate">{selectedLineLabel}</span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        {allLines.map(({ line: l, szenarienCount }) => (
                          <DropdownMenuItem
                            key={l.id}
                            onSelect={() => setTargetLineId(l.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {l.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {l.location} · {szenarienCount} Szenarien
                              </div>
                            </div>
                            {targetLineId === l.id && (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setTargetLineId(NEW_LINE_SENTINEL)}
                        >
                          <span className="text-sm text-primary">
                            + Neue Linie anlegen
                          </span>
                          {isNewLine && (
                            <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {isNewLine && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-dashed border-border p-3 bg-muted/30">
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1">
                          Name der Linie <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={newLineName}
                          onChange={(e) => setNewLineName(e.target.value)}
                          placeholder="z. B. Montage Station 4"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-foreground mb-1">
                          Standort <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={newLineLocation}
                          onChange={(e) => setNewLineLocation(e.target.value)}
                          placeholder="z. B. Halle 2 · Linie B"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Szenario-Label{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder='z. B. "vor Layout-Änderung", "nach Griffhöhen-Anpassung"'
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={start}
                  disabled={!canStart}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <UploadIcon className="h-4 w-4" />
                  Analyse starten
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3 mb-6">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Analyse läuft
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {prepared?.file.name} · {selectedLineLabel}
                    </p>
                  </div>
                </div>

                <Progress value={progress} className="mb-6" />

                <ul className="space-y-3">
                  {STAGES.map((label, i) => {
                    const done = i < stage;
                    const active = i === stage;
                    return (
                      <li key={label} className="flex items-center gap-3">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                            done
                              ? "bg-success/20 text-success"
                              : active
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground/60"
                          }`}
                        >
                          {done ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : active ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span className="text-[10px] tabular-nums">{i + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            done
                              ? "text-muted-foreground line-through"
                              : active
                                ? "text-foreground font-medium"
                                : "text-muted-foreground/70"
                          }`}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
