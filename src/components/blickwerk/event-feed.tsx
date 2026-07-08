import { useMemo, useState } from "react";
import type { ProcessEvent, EventCategory, Severity } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/lib/mock-data";

const CATEGORY_COLOR: Record<EventCategory, string> = {
  Fehlgriff: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  Farbverwechslung: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  Taktzeitueberschreitung: "bg-chart-3/10 text-chart-3 border-chart-3/30",
  Zoegern: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  Prozessunterbrechung: "bg-chart-5/10 text-chart-5 border-chart-5/30",
};

const CATEGORY_BAR: Record<EventCategory, string> = {
  Fehlgriff: "bg-chart-2",
  Farbverwechslung: "bg-chart-4",
  Taktzeitueberschreitung: "bg-chart-3",
  Zoegern: "bg-chart-1",
  Prozessunterbrechung: "bg-chart-5",
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

interface Props {
  events: ProcessEvent[];
  onEventClick?: (e: ProcessEvent) => void;
}

export function EventFeed({ events, onEventClick }: Props) {
  const [active, setActive] = useState<Set<EventCategory>>(new Set());
  const [selected, setSelected] = useState<ProcessEvent | null>(null);

  const counts = useMemo(() => {
    const c: Record<EventCategory, number> = {
      Fehlgriff: 0,
      Farbverwechslung: 0,
      Taktzeitueberschreitung: 0,
      Zoegern: 0,
      Prozessunterbrechung: 0,
    };
    for (const e of events) c[e.category]++;
    return c;
  }, [events]);
  const maxCount = Math.max(1, ...Object.values(counts));

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

  const handleRowClick = (e: ProcessEvent) => {
    onEventClick?.(e);
    setSelected(e);
  };

  return (
    <div className="rounded-xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground">Ereignis-Feed</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} von {events.length} Ereignissen · Klicke eine Kategorie zum Filtern
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 no-print-interactive">
          {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => {
            const isActive = active.has(cat);
            const count = counts[cat];
            const pct = (count / maxCount) * 100;
            return (
              <button
                key={cat}
                onClick={() => toggle(cat)}
                className={`group flex items-center gap-2 text-left ${
                  isActive ? "" : "opacity-90 hover:opacity-100"
                }`}
              >
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : `${CATEGORY_COLOR[cat]} group-hover:border-primary/60`
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="relative h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <span
                      className={`absolute inset-y-0 left-0 ${CATEGORY_BAR[cat]} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground w-5 text-right">
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
          {active.size > 0 && (
            <button
              onClick={() => setActive(new Set())}
              className="text-[11px] text-muted-foreground hover:text-foreground underline"
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
                  onClick={() => handleRowClick(e)}
                  className="w-full text-left px-5 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-[11px] tabular-nums text-muted-foreground w-16 pt-0.5">
                      {formatTime(e.timestamp)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                        {e.human_checkpoint_required && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/15 text-warning-foreground border border-warning/50">
                            Rückfrage nötig
                          </span>
                        )}
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
