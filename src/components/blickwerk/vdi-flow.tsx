import type { StepTimeInfo, ProcessStep } from "@/lib/mock-data";

/**
 * VDI 2860 Handhabungsfunktionen – custom SVG symbols for the
 * bottle-sorting demo. Not a general symbol library.
 */

const box = "stroke-foreground fill-background";
const line = "stroke-foreground";

function SymHalten() {
  // Rectangle with two solid horizontal bars stacked with small gap (grip / hold)
  return (
    <svg viewBox="0 0 64 48" className="w-16 h-12" aria-label="Halten">
      <rect x="4" y="4" width="56" height="40" rx="2" className={box} strokeWidth={1.5} />
      <rect x="14" y="17" width="36" height="4" className="fill-foreground" />
      <rect x="14" y="27" width="36" height="4" className="fill-foreground" />
    </svg>
  );
}

function SymPruefen() {
  // Inverted triangle with three short horizontal lines near top edge (control / inspect)
  return (
    <svg viewBox="0 0 64 48" className="w-16 h-12" aria-label="Farbe prüfen">
      <polygon points="4,4 60,4 32,44" className={box} strokeWidth={1.5} strokeLinejoin="round" />
      <line x1="16" y1="12" x2="22" y2="12" className={line} strokeWidth={1.5} />
      <line x1="29" y1="12" x2="35" y2="12" className={line} strokeWidth={1.5} />
      <line x1="42" y1="12" x2="48" y2="12" className={line} strokeWidth={1.5} />
    </svg>
  );
}

function SymVerzweigen() {
  // Single arrow splitting into two diverging arrows (Y-shape)
  return (
    <svg viewBox="0 0 64 48" className="w-16 h-12" aria-label="Verzweigen">
      <line x1="32" y1="44" x2="32" y2="24" className={line} strokeWidth={1.8} />
      <line x1="32" y1="24" x2="14" y2="10" className={line} strokeWidth={1.8} />
      <line x1="32" y1="24" x2="50" y2="10" className={line} strokeWidth={1.8} />
      {/* arrowheads */}
      <polygon points="14,10 20,10 17,4" className="fill-foreground" />
      <polygon points="50,10 44,10 47,4" className="fill-foreground" />
    </svg>
  );
}

function SymPositionieren() {
  // Rectangle containing a dashed horizontal arrow pointing right (place)
  return (
    <svg viewBox="0 0 64 48" className="w-16 h-12" aria-label="Positionieren">
      <rect x="4" y="4" width="56" height="40" rx="2" className={box} strokeWidth={1.5} />
      <line
        x1="12"
        y1="24"
        x2="48"
        y2="24"
        className={line}
        strokeWidth={1.8}
        strokeDasharray="4 3"
      />
      <polygon points="48,18 48,30 56,24" className="fill-foreground" />
    </svg>
  );
}

function SymLoesen() {
  // Rectangle with two offset/separated horizontal bars (release)
  return (
    <svg viewBox="0 0 64 48" className="w-16 h-12" aria-label="Lösen">
      <rect x="4" y="4" width="56" height="40" rx="2" className={box} strokeWidth={1.5} />
      <rect x="10" y="14" width="24" height="4" className="fill-foreground" />
      <rect x="30" y="30" width="24" height="4" className="fill-foreground" />
    </svg>
  );
}

function SymWeitergeben() {
  // Wavy / curved arrow (rework loop-back)
  return (
    <svg viewBox="0 0 80 32" className="w-20 h-8" aria-label="Weitergeben">
      <path
        d="M4 16 Q 16 4 28 16 T 52 16 T 72 16"
        className={line}
        strokeWidth={1.8}
        fill="none"
      />
      <polygon points="72,10 72,22 78,16" className="fill-foreground" />
    </svg>
  );
}

function fmt(v: number) {
  return v.toFixed(1).replace(".", ",");
}

interface Step {
  key: string;
  label: string;
  Sym: () => React.ReactElement;
  mapTo?: ProcessStep;
}

const STEPS: Step[] = [
  { key: "halten", label: "Halten (Aufnehmen)", Sym: SymHalten, mapTo: "Pick" },
  { key: "pruefen", label: "Farbe prüfen", Sym: SymPruefen, mapTo: "Kontrolle" },
  { key: "verzweigen", label: "Verzweigen", Sym: SymVerzweigen },
  { key: "positionieren", label: "Positionieren", Sym: SymPositionieren, mapTo: "Place" },
  { key: "loesen", label: "Lösen (Freigeben)", Sym: SymLoesen, mapTo: "Place" },
];

export function VdiFlowDiagram({ stepTimes }: { stepTimes: StepTimeInfo[] }) {
  const timeMap = new Map(stepTimes.map((s) => [s.step, s]));

  return (
    <div className="relative">
      <div className="flex items-start justify-between gap-1 overflow-x-auto pb-16 pt-2 min-h-[220px]">
        {STEPS.map((step, i) => {
          const t = step.mapTo ? timeMap.get(step.mapTo) : undefined;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1 min-w-[120px]">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="text-[10px] tabular-nums text-muted-foreground h-4">
                  {t ? `${fmt(t.minSec)}–${fmt(t.maxSec)} s` : ""}
                </div>
                <step.Sym />
                <div className="text-[11px] font-medium text-foreground text-center leading-tight">
                  {step.label}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Schritt {i + 1}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <svg viewBox="0 0 40 12" className="w-8 h-3 shrink-0 mt-8">
                  <line x1="0" y1="6" x2="32" y2="6" className={line} strokeWidth={1.5} />
                  <polygon points="32,2 32,10 40,6" className="fill-foreground" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Rework loop: from Verzweigen (index 2) back to Halten (index 0) */}
      <div className="absolute inset-x-0 bottom-2 pointer-events-none">
        <svg
          viewBox="0 0 1000 60"
          className="w-full h-14"
          preserveAspectRatio="none"
        >
          {/* Curved path from ~40% (Verzweigen) down and back to ~8% (Halten) */}
          <path
            d="M 400 4 C 400 55, 80 55, 80 8"
            className="stroke-warning"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
          <polygon points="80,8 74,16 86,16" className="fill-warning" />
        </svg>
        <div className="relative -mt-10 flex items-center gap-2 pl-[18%]">
          <SymWeitergeben />
          <span className="text-[11px] font-medium text-warning">Korrektur</span>
        </div>
      </div>

      <div className="absolute top-0 right-0 text-[10px] uppercase tracking-wider text-muted-foreground">
        Funktionsfolge nach VDI 2860
      </div>
    </div>
  );
}
