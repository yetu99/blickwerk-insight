import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import type { ProcessEvent, EventCategory, Severity } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/lib/mock-data";
import { EventDetailDialog } from "./event-detail-dialog";

const CATEGORY_COLOR: Record<EventCategory, string> = {
  Fehlgriff: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  Farbverwechslung: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  Taktzeitueberschreitung: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  Zoegern: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  Prozessunterbrechung: "bg-chart-5/10 text-chart-5 border-chart-5/30",
};

const SEVERITY_STYLES: Record<Severity, { label: string; className: string }> = {
  low: { label: "Niedrig", className: "bg-muted text-muted-foreground" },
  medium: { label: "Mittel", className: "bg-warning/15 text-warning-foreground border border-warning/40" },
  high: { label: "Hoch", className: "bg-destructive/10 text-destructive border border-destructive/30" },
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function EventFeed({ events }: { events: ProcessEvent[] }) {
  const [active, setActive] = useState<Set<EventCategory>>(new Set());
  const [selected, setSelected] = useState<ProcessEvent | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
    if (active.size === 0) return sorted;
    return sorted.filter((e) => active.has(e.category));
  }, [events, active]);

  const toggle = (c: EventCategory) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  return (
    <div className="rounded-xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ereignis-Feed</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} von {events.length} Ereignissen
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => {
            const isActive = active.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggle(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
          {active.size > 0 && (
            <button
              onClick={() => setActive(new Set())}
              className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[520px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Keine Ereignisse in dieser Auswahl.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelected(e)}
                  className="w-full text-left px-5 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-[11px] tabular-nums text-muted-foreground w-16 pt-0.5">
                      {formatTime(e.timestamp)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLOR[e.category]}`}
                        >
                          {CATEGORY_LABELS[e.category]}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SEVERITY_STYLES[e.severity].className}`}
                        >
                          {SEVERITY_STYLES[e.severity].label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate">{e.description}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EventDetailDialog event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
