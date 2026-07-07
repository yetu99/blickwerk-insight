import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Upload as UploadIcon,
  Film,
  Check,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LINES, generateRun } from "@/lib/mock-data";
import { setRun, setVideo } from "@/lib/runs-store";


export const Route = createFileRoute("/neue-analyse")({
  head: () => ({
    meta: [
      { title: "Neue Analyse – symplify" },
      {
        name: "description",
        content:
          "Video hochladen und eine neue Prozess-Analyse für eine Fertigungslinie starten.",
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

function NeueAnalyse() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<PreparedFile | null>(null);
  const [probing, setProbing] = useState(false);
  const [lineId, setLineId] = useState<string>(LINES[0].id);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);

  const activeLine = LINES.find((l) => l.id === lineId) ?? LINES[0];

  useEffect(() => {
    if (!running) return;
    if (stage >= STAGES.length) {
      if (!prepared) return;
      const seed = generateRun(lineId, prepared.durationSec);
      setVideo(lineId, {
        url: prepared.url,
        durationSec: prepared.durationSec,
        filename: prepared.file.name,
        sizeBytes: prepared.file.size,
      });
      setRun(lineId, seed);
      const t = setTimeout(() => navigate({ to: "/" }), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 1700);
    return () => clearTimeout(t);
  }, [running, stage, lineId, navigate, prepared]);

  const onSelectFile = (f: File | null) => {
    if (!f) return;
    if (!/\.(mp4|mov|m4v|quicktime)$/i.test(f.name) && !f.type.startsWith("video/")) {
      return;
    }
    setProbing(true);
    // Read real duration from browser metadata before enabling start.
    const url = URL.createObjectURL(f);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
    };
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : 60; // fallback so demo still works
      setPrepared({ file: f, url, durationSec: duration });
      setProbing(false);
      cleanup();
    };
    video.onerror = () => {
      // Fall back to a plausible default; still usable for demo.
      setPrepared({ file: f, url, durationSec: 60 });
      setProbing(false);
      cleanup();
    };
  };

  const clearFile = () => {
    if (prepared) {
      try {
        URL.revokeObjectURL(prepared.url);
      } catch {
        /* noop */
      }
    }
    setPrepared(null);
  };

  const start = () => {
    if (!prepared) return;
    setStage(0);
    setRunning(true);
  };

  const progress = running ? Math.min(100, (stage / STAGES.length) * 100) : 0;


  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={activeLine} />

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
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
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
                  2. Linie zuordnen
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Die Analyse wird der gewählten Station zugeordnet.
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full sm:w-auto inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-primary/50 transition-colors">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {activeLine.name}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Produktionslinie
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {LINES.map((l) => (
                      <DropdownMenuItem
                        key={l.id}
                        onSelect={() => setLineId(l.id)}
                        className="flex flex-col items-start gap-0.5 py-2"
                      >
                        <span className="text-sm font-medium">{l.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {l.location} · {l.camera_id}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={start}
                  disabled={!file}
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
                      {file?.name} · {activeLine.name}
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
