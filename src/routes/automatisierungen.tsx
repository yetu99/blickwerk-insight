import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  Clock,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { LINES } from "@/lib/mock-data";
import { useAllLines } from "@/lib/runs-store";
import digitalTwinAsset from "@/assets/fabrikhalle.png.asset.json";

export const Route = createFileRoute("/automatisierungen")({
  validateSearch: (s: Record<string, unknown>) => ({
    line: typeof s.line === "string" ? s.line : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Automatisierung – symplify" },
      {
        name: "description",
        content:
          "Digital-Twin-Kommandozentrale: KI-Optimierungsvorschläge einsehen und eigene Parameteränderungen simulieren.",
      },
    ],
  }),
  component: AutomatisierungPage,
});

// -----------------------------------------------------------------------------
// Mock data — KI-Optimierungsvorschläge (spiegelt Tab "Linie" wider)
// -----------------------------------------------------------------------------

interface OptimizationSuggestion {
  id: string;
  title: string;
  parameter: string;
  dlzDelta: number; // negative = Verbesserung (kürzere DLZ)
  wasteDelta: number; // negative = Verbesserung (weniger Ausschuss)
  impact: "hoch" | "mittel" | "niedrig";
}

const SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: "s1",
    title: "Farbklassifikator vor Greifer nachschalten",
    parameter: "Station 2 · Farbprüfung",
    dlzDelta: -6.4,
    wasteDelta: -18.2,
    impact: "hoch",
  },
  {
    id: "s2",
    title: "Greiferposition per Vision-Feedback nachregeln",
    parameter: "Station 3 · Pick-Arm",
    dlzDelta: -4.1,
    wasteDelta: -9.5,
    impact: "hoch",
  },
  {
    id: "s3",
    title: "Puffer vor Kontrollstation vergrößern (2 Slots)",
    parameter: "Kontrollstation · Zulauf",
    dlzDelta: -7.8,
    wasteDelta: -2.1,
    impact: "mittel",
  },
  {
    id: "s4",
    title: "Anzeige-Layout am Bedienplatz umstellen",
    parameter: "HMI · Bedienplatz",
    dlzDelta: -2.3,
    wasteDelta: -1.4,
    impact: "niedrig",
  },
  {
    id: "s5",
    title: "Automatischer Wiederanlauf nach Kurzstopp",
    parameter: "SPS · Station 4",
    dlzDelta: -5.2,
    wasteDelta: -3.6,
    impact: "mittel",
  },
];

const IMPACT_STYLE: Record<OptimizationSuggestion["impact"], string> = {
  hoch: "bg-success/15 text-success border-success/40",
  mittel: "bg-warning/15 text-warning-foreground border-warning/40",
  niedrig: "bg-muted text-muted-foreground border-border",
};

// Baseline KPIs
const BASELINE = { dlz: 42.6, waste: 3.8 }; // Sekunden, Prozent

const SIM_STAGES = [
  "Analysiere Parameteränderungen…",
  "Berechne Auswirkungen auf DLZ und Waste…",
  "Simuliere neue Linienkonfiguration…",
  "Validiere Ergebnisse gegen Ist-Zustand…",
];

// Deterministic pseudo-random from input string, so „gleicher Prompt = gleiches Ergebnis"
function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

interface SimulationResult {
  n: number;
  parameter: string;
  dlz: number;
  waste: number;
  dlzDelta: number; // % vs. Vorzustand
  wasteDelta: number;
  dlzAbs: number; // absolute Differenz Sekunden
  wasteAbs: number; // absolute Prozentpunkte
}

function AutomatisierungPage() {
  const search = Route.useSearch();
  const allLines = useAllLines();
  const lineId = search.line ?? allLines[0]?.line.id ?? LINES[0].id;
  const line = allLines.find((l) => l.line.id === lineId)?.line ?? LINES[0];

  const [input, setInput] = useState("");
  const [simStage, setSimStage] = useState(-1);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [twinKey, setTwinKey] = useState(0);
  const pendingRef = useRef<{ parameter: string } | null>(null);

  const latest = history[history.length - 1];
  const currentKpis = latest
    ? { dlz: latest.dlz, waste: latest.waste }
    : BASELINE;

  const heading = latest
    ? `Simulation ${latest.n} mit Parameter „${truncate(latest.parameter, 60)}"`
    : "Automatisierung";

  // Simulation-Ladelauf
  useEffect(() => {
    if (simStage < 0) return;
    if (simStage >= SIM_STAGES.length) {
      // Ergebnis anwenden
      const pending = pendingRef.current;
      if (pending) {
        const seed = hashSeed(pending.parameter + history.length);
        const dlzImprovement = 0.03 + seed * 0.09; // 3–12 %
        const wasteImprovement = 0.05 + ((seed * 7) % 1) * 0.15; // 5–20 %
        const newDlz = currentKpis.dlz * (1 - dlzImprovement);
        const newWaste = currentKpis.waste * (1 - wasteImprovement);
        const result: SimulationResult = {
          n: history.length + 1,
          parameter: pending.parameter,
          dlz: newDlz,
          waste: newWaste,
          dlzDelta: -dlzImprovement * 100,
          wasteDelta: -wasteImprovement * 100,
          dlzAbs: newDlz - currentKpis.dlz,
          wasteAbs: newWaste - currentKpis.waste,
        };
        setHistory((h) => [...h, result]);
        setTwinKey((k) => k + 1);
      }
      pendingRef.current = null;
      setSimStage(-1);
      return;
    }
    const t = setTimeout(() => setSimStage((s) => s + 1), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simStage]);

  const isSimulating = simStage >= 0;

  const startSimulation = () => {
    const parameter = input.trim();
    if (!parameter || isSimulating) return;
    pendingRef.current = { parameter };
    setSimStage(0);
    setInput("");
  };

  const applySuggestion = (s: OptimizationSuggestion) => {
    setInput(s.title);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={line} />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {heading}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {line.name} · Digital-Twin-Kommandozentrale
          </p>
        </header>

        <div className="flex-1 p-6 space-y-6 max-w-6xl w-full">
          {/* KPI-Kacheln */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              label="Durchlaufzeit (DLZ)"
              value={currentKpis.dlz}
              unit="s"
              icon={Clock}
              baseline={BASELINE.dlz}
              changed={!!latest}
            />
            <KpiCard
              label="Ausschuss (Waste)"
              value={currentKpis.waste}
              unit="%"
              icon={Zap}
              baseline={BASELINE.waste}
              changed={!!latest}
            />
          </section>

          {/* Simulations-Eingabe */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Eigene Optimierung simulieren
            </h2>
            <p className="text-[11px] text-muted-foreground mb-4">
              Beschreibe eine konkrete Parameteränderung. Der Digital Twin
              berechnet die Auswirkung auf DLZ und Waste.
            </p>
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSimulating}
                rows={3}
                placeholder='z. B. „Erhöhe die Taktzahl an Station 3 um 10 %" oder „Reduziere die Rüstzeit der Verpackungsanlage"'
                className="flex-1 min-w-0 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
              />
              <button
                onClick={startSimulation}
                disabled={!input.trim() || isSimulating}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02]"
                style={{ backgroundColor: "#3BA4F5" }}
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Simuliert …
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Simulieren
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Digital-Twin-Visualisierung */}
          <section className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Digital Twin · Live-Ansicht
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Virtuelles Abbild der Produktionslinie
                  {latest ? ` · nach Simulation ${latest.n}` : " · Ist-Zustand"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative inline-flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Twin synchronisiert
                </span>
              </div>
            </div>
            <div className="relative bg-muted/30 p-4">
              <div
                key={twinKey}
                className="relative w-full rounded-lg overflow-hidden border border-border bg-background animate-in fade-in duration-500"
                style={{ aspectRatio: "3 / 2" }}
              >
                <img
                  src={digitalTwinAsset.url}
                  alt="Digital-Twin-Visualisierung der Produktionslinie"
                  className="w-full h-full object-contain"
                />
                {isSimulating && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center px-6 max-w-md">
                      <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                      <div className="text-sm font-medium text-foreground mb-3">
                        Simulation läuft …
                      </div>
                      <ul className="space-y-1.5 text-left">
                        {SIM_STAGES.map((s, i) => (
                          <li
                            key={s}
                            className={`flex items-center gap-2 text-xs ${
                              i < simStage
                                ? "text-muted-foreground line-through"
                                : i === simStage
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground/60"
                            }`}
                          >
                            {i < simStage ? (
                              <Check className="h-3 w-3 text-success shrink-0" />
                            ) : i === simStage ? (
                              <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                            ) : (
                              <span className="h-3 w-3 rounded-full border border-muted-foreground/40 shrink-0" />
                            )}
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>


          {/* Simulationsergebnis */}
          {latest && (
            <section className="rounded-xl border border-primary/40 bg-primary/5 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-primary font-medium">
                    Ergebnis Simulation {latest.n}
                  </div>
                  <div className="text-sm text-foreground mt-0.5">
                    Parameter: „{latest.parameter}"
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DeltaCard
                  label="DLZ"
                  before={
                    history.length >= 2 ? history[history.length - 2].dlz : BASELINE.dlz
                  }
                  after={latest.dlz}
                  unit="s"
                  lowerIsBetter
                />
                <DeltaCard
                  label="Waste"
                  before={
                    history.length >= 2 ? history[history.length - 2].waste : BASELINE.waste
                  }
                  after={latest.waste}
                  unit="%"
                  lowerIsBetter
                />
              </div>
            </section>
          )}

          {/* KI-Optimierungsvorschläge */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  KI-Optimierungsvorschläge
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Übernommen aus der Fehleranalyse im Tab „Linien". Klicken zum
                  Übernehmen ins Simulationsfeld.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 font-medium">Vorschlag</th>
                    <th className="py-2 pr-3 font-medium">Parameter / Schritt</th>
                    <th className="py-2 pr-3 font-medium text-right">DLZ</th>
                    <th className="py-2 pr-3 font-medium text-right">Waste</th>
                    <th className="py-2 pr-3 font-medium">Wirkung</th>
                    <th className="py-2 pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {SUGGESTIONS.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/40 transition-colors"
                    >
                      <td className="py-3 pr-3 font-medium text-foreground">
                        {s.title}
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {s.parameter}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums text-success">
                        {s.dlzDelta.toFixed(1).replace(".", ",")} %
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums text-success">
                        {s.wasteDelta.toFixed(1).replace(".", ",")} %
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block text-[10px] font-medium border rounded px-1.5 py-0.5 ${IMPACT_STYLE[s.impact]}`}
                        >
                          {s.impact}
                        </span>
                      </td>
                      <td className="py-3 pr-0 text-right">
                        <button
                          onClick={() => applySuggestion(s)}
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          Übernehmen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Simulationsverlauf */}
          {history.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Simulationsverlauf
                </h2>
                <button
                  onClick={() => setHistory([])}
                  className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Zurücksetzen
                </button>
              </div>
              <ol className="space-y-2">
                {history.map((h) => (
                  <li
                    key={h.n}
                    className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <div className="shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center tabular-nums">
                      {h.n}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-foreground truncate">{h.parameter}</div>
                      <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                        DLZ {h.dlz.toFixed(1).replace(".", ",")} s
                        <span className="text-success ml-1">
                          ({h.dlzDelta.toFixed(1).replace(".", ",")} %)
                        </span>
                        {" · "}
                        Waste {h.waste.toFixed(2).replace(".", ",")} %
                        <span className="text-success ml-1">
                          ({h.wasteDelta.toFixed(1).replace(".", ",")} %)
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  baseline,
  changed,
}: {
  label: string;
  value: number;
  unit: string;
  icon: typeof Clock;
  baseline: number;
  changed: boolean;
}) {
  const delta = value - baseline;
  const pct = baseline === 0 ? 0 : (delta / baseline) * 100;
  const positive = delta < 0; // niedriger ist besser
  return (
    <div className="rounded-xl bg-card border border-border p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
          <Icon className="h-4 w-4 text-accent-foreground" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {value.toFixed(unit === "%" ? 2 : 1).replace(".", ",")}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 h-4 text-xs">
        {changed && (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              positive ? "text-success" : "text-destructive"
            }`}
          >
            {positive ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )}
            {pct.toFixed(1).replace(".", ",")} % vs. Ist
          </span>
        )}
      </div>
    </div>
  );
}

function DeltaCard({
  label,
  before,
  after,
  unit,
  lowerIsBetter,
}: {
  label: string;
  before: number;
  after: number;
  unit: string;
  lowerIsBetter: boolean;
}) {
  const abs = after - before;
  const pct = before === 0 ? 0 : (abs / before) * 100;
  const improved = lowerIsBetter ? abs < 0 : abs > 0;
  const color = improved ? "text-success" : "text-destructive";
  const bg = improved
    ? "bg-success/10 border-success/40"
    : "bg-destructive/10 border-destructive/40";
  const Arrow = improved ? ArrowDown : ArrowUp;
  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {after.toFixed(unit === "%" ? 2 : 1).replace(".", ",")} {unit}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          vorher {before.toFixed(unit === "%" ? 2 : 1).replace(".", ",")} {unit}
        </span>
      </div>
      <div className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${color}`}>
        <Arrow className="h-4 w-4" />
        {abs > 0 ? "+" : ""}
        {abs.toFixed(unit === "%" ? 2 : 1).replace(".", ",")} {unit}
        <span className="text-xs font-medium ml-1">
          ({pct > 0 ? "+" : ""}
          {pct.toFixed(1).replace(".", ",")} %)
        </span>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
