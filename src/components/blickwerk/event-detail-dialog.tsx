import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Film } from "lucide-react";
import type { ProcessEvent } from "@/lib/mock-data";
import { CATEGORY_LABELS } from "@/lib/mock-data";

interface Props {
  event: ProcessEvent | null;
  onClose: () => void;
}

export function EventDetailDialog({ event, onClose }: Props) {
  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">
                {CATEGORY_LABELS[event.category]}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString("de-DE")} · Zyklus {event.cycle_id}
              </p>
            </DialogHeader>

            {/* Video placeholder — fixed 16:9, dashed border, functionally empty */}
            <div
              className="w-full rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center"
              style={{ aspectRatio: "16 / 9" }}
            >
              <div className="text-center px-6">
                <Film className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  Video-Clip wird manuell verknüpft
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Kein Clip hinterlegt · Feld reserviert für spätere Verknüpfung
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Schweregrad
                </div>
                <div className="text-sm font-medium mt-0.5 capitalize">{event.severity}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Ereignis-ID
                </div>
                <div className="text-sm font-medium mt-0.5 tabular-nums">{event.id}</div>
              </div>
            </div>

            <div className="pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                Beschreibung
              </div>
              <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
