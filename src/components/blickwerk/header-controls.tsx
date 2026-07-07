import { ChevronDown, Calendar as CalendarIcon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RANGE_PRESETS, type RangePresetId } from "@/lib/mock-data";
import { useAllLines, useSzenarienForLine } from "@/lib/runs-store";

interface Props {
  lineId: string;
  szenarioId?: string;
  onSelect: (lineId: string, szenarioId: string) => void;
  presetId: RangePresetId;
  onPresetChange: (id: RangePresetId) => void;
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HeaderControls({
  lineId,
  szenarioId,
  onSelect,
  presetId,
  onPresetChange,
}: Props) {
  const allLines = useAllLines();
  const activeLine =
    allLines.find((l) => l.line.id === lineId)?.line ?? allLines[0]?.line;
  const szenarien = useSzenarienForLine(lineId);
  const activeSz = szenarien.find((s) => s.id === szenarioId) ?? szenarien[0];
  const activePreset =
    RANGE_PRESETS.find((p) => p.id === presetId) ?? RANGE_PRESETS[0];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-primary/50 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {activeLine?.name}
            {activeSz && (
              <span className="text-muted-foreground text-xs">
                · {activeSz.label}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
          {allLines.map(({ line: l, savedAt, szenarienCount }) => {
            const lineSzenarien =
              // Small inline lookup via passing through: we use useSzenarienForLine only for active.
              // Compute per-item via same store: not reactive but fine here.
              // (Menu only opens on demand.)
              // eslint-disable-next-line react-hooks/rules-of-hooks
              undefined;
            void lineSzenarien;
            return (
              <div key={l.id} className="py-1">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  {l.name}
                  {savedAt !== null && (
                    <span className="text-[9px] normal-case tracking-normal text-primary bg-primary/10 border border-primary/30 rounded px-1 py-0.5">
                      Neu
                    </span>
                  )}
                  <span className="ml-auto text-[10px] normal-case tracking-normal text-muted-foreground">
                    {szenarienCount} Szenarien
                  </span>
                </DropdownMenuLabel>
                <SzenarioSubList
                  lineId={l.id}
                  currentLine={lineId}
                  currentSz={szenarioId}
                  onSelect={onSelect}
                />
                <DropdownMenuSeparator />
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-primary/50 transition-colors">
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {activePreset.label}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Zeitraum
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {RANGE_PRESETS.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={() => onPresetChange(p.id)}
              className="flex items-center gap-2"
            >
              <div className="w-4">
                {p.id === presetId && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <span className="text-sm">{p.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SzenarioSubList({
  lineId,
  currentLine,
  currentSz,
  onSelect,
}: {
  lineId: string;
  currentLine: string;
  currentSz?: string;
  onSelect: (lineId: string, szenarioId: string) => void;
}) {
  const list = useSzenarienForLine(lineId);
  if (list.length === 0) {
    return (
      <div className="px-3 py-2 text-[11px] text-muted-foreground">
        Noch keine Szenarien
      </div>
    );
  }
  return (
    <>
      {list.map((sz) => {
        const active = lineId === currentLine && sz.id === currentSz;
        return (
          <DropdownMenuItem
            key={sz.id}
            onSelect={() => onSelect(lineId, sz.id)}
            className="flex items-start gap-2 py-2"
          >
            <div className="w-4 pt-0.5">
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground truncate">{sz.label}</div>
              <div className="text-[11px] text-muted-foreground">
                {fmtDate(sz.createdAt)} · {sz.cycles.length} Zyklen
              </div>
            </div>
          </DropdownMenuItem>
        );
      })}
    </>
  );
}
