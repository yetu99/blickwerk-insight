import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface Props {
  src: string;
  /** Video-relative seconds where the event begins. */
  eventStart: number;
  /** Video-relative seconds where the event ends. */
  eventEnd: number;
  /** Total video duration in seconds, used to clamp the window. */
  videoDuration: number;
  /** ±context in seconds. */
  contextSec?: number;
}

function fmt(sec: number) {
  if (!Number.isFinite(sec)) return "0.0s";
  return `${sec.toFixed(1)}s`;
}

export function EventVideoPlayer({
  src,
  eventStart,
  eventEnd,
  videoDuration,
  contextSec = 5,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const windowStart = Math.max(0, eventStart - contextSec);
  const windowEnd = Math.min(videoDuration || eventEnd + contextSec, eventEnd + contextSec);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(windowStart);

  // Seek to window start on mount / when the event changes.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const seek = () => {
      try {
        v.currentTime = windowStart;
      } catch {
        /* noop */
      }
      setCurrent(windowStart);
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
    return () => v.removeEventListener("loadedmetadata", seek);
  }, [windowStart, src]);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    if (v.currentTime >= windowEnd) {
      v.pause();
      setPlaying(false);
      // Snap back to end-of-window for visual clarity.
      try {
        v.currentTime = windowEnd;
      } catch {
        /* noop */
      }
    }
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < windowStart || v.currentTime >= windowEnd) {
        v.currentTime = windowStart;
      }
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

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-muted-foreground">
        Ausschnitt: {fmt(eventStart)} – {fmt(eventEnd)} (±{contextSec}s Kontext)
      </div>
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
          onEnded={() => setPlaying(false)}
          onClick={toggle}
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
        <input
          type="range"
          min={windowStart}
          max={windowEnd}
          step={0.05}
          value={Math.min(windowEnd, Math.max(windowStart, current))}
          onChange={onScrub}
          className="flex-1 h-1.5 accent-primary"
          aria-label="Position im Ausschnitt"
        />
        <div className="text-[11px] tabular-nums text-muted-foreground w-24 text-right">
          {fmt(current)} / {fmt(windowEnd)}
        </div>
      </div>
    </div>
  );
}
