import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ProcessEvent } from "@/lib/mock-data";
import { CATEGORY_LABELS, CLUSTER_LABELS } from "@/lib/mock-data";

interface Props {
  event: ProcessEvent | null;
  onClose: () => void;
}

export function EventDetailDialog({ event, onClose }: Props) {
  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">
                {CATEGORY_LABELS[event.category]}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString("de-DE")} · Zyklus{" "}
                {event.cycle_id}
              </p>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Schweregrad
                </div>
                <div className="text-sm font-medium mt-0.5 capitalize">
                  {event.severity}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Konfidenz
                </div>
                <div className="text-sm font-medium mt-0.5 tabular-nums">
                  {(event.confidence * 100).toFixed(0)}%
                  {event.human_checkpoint_required && (
                    <span className="ml-2 text-[10px] font-medium text-warning-foreground bg-warning/15 border border-warning/50 rounded px-1.5 py-0.5">
                      Rückfrage nötig
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Cluster-Quelle
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {CLUSTER_LABELS[event.cluster_source]}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Ereignis-ID
                </div>
                <div className="text-sm font-medium mt-0.5 tabular-nums">
                  {event.id}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                Beschreibung
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
