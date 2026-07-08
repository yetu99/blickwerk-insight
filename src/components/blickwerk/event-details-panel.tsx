import type { EventCategory, ProcessEvent } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/lib/mock-data";

const CATEGORY_BADGE: Record<EventCategory, string> = {
  Neutral: "bg-[#14B8A6]/15 text-[#14B8A6] border-[#14B8A6]/50",
  Fehler: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/50",
};

function fmt(sec?: number) {
  if (sec === undefined || !Number.isFinite(sec)) return "–";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function EventDetailsPanel({ event }: { event: ProcessEvent | null }) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-[var(--shadow-card)] p-5 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Event-Details</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {event
            ? "Detailinfos zum ausgewählten Ereignis"
            : "Wähle einen Timeline-Punkt oder eine Zeile im Ereignis-Feed"}
        </p>
      </div>

      {!event ? (
        <div className="rounded-md border border-dashed border-border bg-muted/40 py-8 text-center text-xs text-muted-foreground">
          Event auswählen
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs tabular-nums text-muted-foreground font-medium">
              {fmt(event.video_timestamp_start)} – {fmt(event.video_timestamp_end)}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${CATEGORY_BADGE[event.category]}`}
            >
              {CATEGORY_LABELS[event.category]}
            </span>
          </div>
          {event.title && (
            <div className="text-sm font-semibold text-foreground">
              {event.title}
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </div>
      )}
    </div>
  );
}
