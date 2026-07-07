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
import { useAllLines } from "@/lib/runs-store";

interface Props {
  lineId: string;
  onLineChange: (id: string) => void;
  presetId: RangePresetId;
  onPresetChange: (id: RangePresetId) => void;
}

export function HeaderControls({ lineId, onLineChange, presetId, onPresetChange }: Props) {
  const allLines = useAllLines();
  const activeLine =
    allLines.find((l) => l.line.id === lineId)?.line ?? allLines[0].line;
  const activePreset = RANGE_PRESETS.find((p) => p.id === presetId) ?? RANGE_PRESETS[0];


  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-primary/50 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {activeLine.name}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Produktionslinie
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allLines.map(({ line: l, savedAt }) => (
            <DropdownMenuItem
              key={l.id}
              onSelect={() => onLineChange(l.id)}
              className="flex items-start gap-2 py-2"
            >
              <div className="w-4 pt-0.5">
                {l.id === lineId && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  {l.name}
                  {savedAt !== null && (
                    <span className="text-[9px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded px-1 py-0.5">
                      Neu
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {l.location} · {l.camera_id}
                </div>
              </div>
            </DropdownMenuItem>
          ))}

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
                {p.id === presetId && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
              <span className="text-sm">{p.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
