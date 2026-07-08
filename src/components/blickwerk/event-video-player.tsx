import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Play, Pause, Film } from "lucide-react";
import type { EventCategory, ProcessEvent } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/lib/mock-data";

interface Props {
  src: string | null;
  videoDuration: number;
  events: ProcessEvent[];
  onEventPick?: (e: ProcessEvent) => void;
}

export interface SzenarioVideoHandle {
  seekTo: (event: ProcessEvent) => void;
  seekToTime: (seconds: number) => void;
}

const CATEGORY_DOT: Record<EventCategory, string> = {
  Fehlgriff: "bg-chart-2 border-chart-2",
  Farbverwechslung: "bg-chart-4 border-chart-4",
  Taktzeitueberschreitung: "bg-chart-3 border-chart-3",
  Zoegern: "bg-chart-1 border-chart-1",
  Prozessunterbrechung: "bg-chart-5 border-chart-5",
};

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const SzenarioVideoPlayer = forwardRef<SzenarioVideoHandle, Props>(
  function SzenarioVideoPlayer(
    { src, videoDuration, events, onEventPick },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(videoDuration);
    const [highlight, setHighlight] = useState<{
      start: number;
      end: number;
    } | null>(null);
    const highlightTimer = useRef<number | null>(null);

    useEffect(() => {
      setDuration(videoDuration);
    }, [videoDuration]);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (event: ProcessEvent) => {
          const v = videoRef.current;
          const start = event.video_timestamp_start ?? 0;
          const end = event.video_timestamp_end ?? start + 1;
          if (v && Number.isFinite(start)) {
            try {
              v.currentTime = start;
            } catch { /* noop */ }
            setCurrent(start);
          }
          const dur = duration || videoDuration || end + 5;
          setHighlight({
            start: Math.max(0, start - 5),
            end: Math.min(dur, end + 5),
          });
          if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
          highlightTimer.current = window.setTimeout(() => {
            setHighlight(null);
          }, 3200);
        },
        seekToTime: (seconds: number) => {
          const v = videoRef.current;
          if (v && Number.isFinite(seconds)) {
            try {
              v.currentTime = seconds;
            } catch { /* noop */ }
            setCurrent(seconds);
          }
        },
      }),
      [duration, videoDuration],
    );

    if (!src) {
      return (
        <div
          className="w-full rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div className="text-center px-6">
            <Film className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              Kein Video verknüpft
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Für dieses Szenario wurde noch kein Video hochgeladen.
            </p>
          </div>
        </div>
      );
    }

    const onTimeUpdate = () => {
      const v = videoRef.current;
      if (!v) return;
      setCurrent(v.currentTime);
    };

    const onLoaded = () => {
      const v = videoRef.current;
      if (v && Number.isFinite(v.duration) && v.duration > 0) {
        setDuration(v.duration);
      }
    };

    const toggle = () => {
      const v = videoRef.current;
      if (!v) return;
      if (v.paused) {
        v.play();
        setPlaying(true);
      } else {
        v.pause();
        setPlaying(false);
      }
    };

    const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = videoRef.current;
      const t = Number(e.target.value);
      if (v) v.currentTime = t;
      setCurrent(t);
    };

    const seekEvent = (e: ProcessEvent) => {
      const v = videoRef.current;
      const start = e.video_timestamp_start ?? 0;
      const end = e.video_timestamp_end ?? start + 1;
      if (v) {
        try {
          v.currentTime = start;
        } catch { /* noop */ }
      }
      setCurrent(start);
      setHighlight({
        start: Math.max(0, start - 5),
        end: Math.min(duration, end + 5),
      });
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlight(null), 3200);
      onEventPick?.(e);
    };

    const total = duration || 1;

    return (
      <div className="space-y-3">
        <div
          className="w-full rounded-lg overflow-hidden bg-black relative"
          style={{ aspectRatio: "16 / 9" }}
        >
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            preload="metadata"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoaded}
            onEnded={() => setPlaying(false)}
            onClick={toggle}
          />
        </div>

        {/* Custom track with markers + highlight — full width, live-bound */}
        <div className="relative w-full h-8 select-none">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-muted" />
          {highlight && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-sm bg-primary/25 border border-primary/60 transition-opacity"
              style={{
                left: `${(highlight.start / total) * 100}%`,
                width: `${((highlight.end - highlight.start) / total) * 100}%`,
              }}
            />
          )}
          {/* Progress fill — bound to video's timeupdate via setCurrent */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, (current / total) * 100))}%` }}
          />
          {/* Markers */}
          {events.map((e) => {
            const start = e.video_timestamp_start;
            if (start === undefined) return null;
            const pct = (start / total) * 100;
            return (
              <button
                key={e.id}
                onClick={() => seekEvent(e)}
                title={`${CATEGORY_LABELS[e.category]} · ${e.description}`}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-background shadow ${CATEGORY_DOT[e.category]} hover:scale-125 transition-transform`}
                style={{ left: `${pct}%` }}
                aria-label={`${CATEGORY_LABELS[e.category]} bei ${fmt(start)}`}
              />
            );
          })}
          {/* Invisible range slider on top for scrubbing */}
          <input
            type="range"
            min={0}
            max={total}
            step={0.05}
            value={Math.min(total, Math.max(0, current))}
            onChange={onScrub}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Video-Position"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            aria-label={playing ? "Pause" : "Abspielen"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <div className="text-[11px] tabular-nums text-muted-foreground">
            {fmt(current)} / {fmt(total)}
          </div>
          <div className="ml-auto text-[11px] text-muted-foreground">
            {events.length} markierte Ereignisse
          </div>
        </div>
      </div>
    );
  },
);
