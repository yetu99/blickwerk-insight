import { useSettings, type Lang } from "./settings-store";

type Dict = Record<string, string>;

const DE: Dict = {
  "nav.neueAnalyse": "Neue Analyse",
  "nav.uebersicht": "Übersicht",
  "nav.linien": "Linien",
  "nav.ereignisse": "Werkhalle",
  "nav.automatisierungen": "Automatisierung",
  "nav.einstellungen": "Einstellungen",
  "sidebar.activeLine": "Aktive Linie",
  "sidebar.liveActive": "Live-Analyse aktiv",
  "sidebar.help": "Hilfe & Support",

  "page.uebersicht.title": "Übersicht",
  "page.uebersicht.subtitle": "Live-Analyse",
  "page.linien.title": "Linien",
  "page.ereignisse.title": "Ereignisse",
  "page.ereignisse.subtitle": "Linien-übergreifende Fehleranalyse",
  "page.ereignisse.ranking": "Fehleranfälligkeit nach Linie & Prozessschritt",
  "page.ereignisse.patterns": "Linienübergreifende Muster",
  "page.automatisierungen.title": "Automatisierungen",
  "page.automatisierungen.currentState": "Prozess-Ist-Zustand",
  "page.automatisierungen.simulate": "Digitalen Zwilling simulieren",
  "page.automatisierungen.disclaimer":
    "Vereinfachte Simulation zu Demonstrationszwecken, ersetzt keine reale Digital-Twin-Validierung (z. B. NVIDIA Isaac Sim).",
  "page.einstellungen.title": "Einstellungen",
  "page.einstellungen.theme": "Erscheinungsbild",
  "page.einstellungen.themeHint": "Wechseln zwischen hellem und dunklem Design.",
  "page.einstellungen.language": "Sprache",
  "page.einstellungen.languageHint": "Sprache der Benutzeroberfläche.",
  "theme.light": "Hell",
  "theme.dark": "Dunkel",

  "kpi.throughput": "Durchsatz",
  "kpi.avgCycle": "Ø Taktzeit",
  "kpi.errorRate": "Fehlerquote",
  "kpi.downtime": "Stillstandzeit",
  "kpi.throughputUnit": "Einheiten/min",
  "kpi.cycleUnit": "Sekunden",
  "kpi.downtimeUnit": "Minuten",

  "table.line": "Linie",
  "table.step": "Prozessschritt",
  "table.errorRate": "Fehlerquote",
  "table.dominantCategory": "Dominierende Kategorie",

  "auto.step.pick": "Pick",
  "auto.step.place": "Place",
  "auto.step.kontrolle": "Kontrolle",
  "auto.step.korrektur": "Korrektur",
  "auto.badge.good": "gut automatisierbar",
  "auto.badge.limited": "bedingt automatisierbar",
  "auto.badge.no": "nicht automatisierbar",
  "auto.card.current": "Aktuell",
  "auto.card.withAutomation": "Mit Automatisierung",
  "auto.metric.takt": "Taktzeit",
  "auto.metric.throughput": "Durchsatz",
  "auto.metric.workload": "Arbeitszeit / Woche",
  "auto.savings": "Geschätzte Einsparung",

  "btn.save": "Speichern",
  "btn.discard": "Verwerfen",
  "btn.startAnalysis": "Analyse starten",
  "btn.simulate": "Digitalen Zwilling simulieren",
  "btn.simulateAgain": "Simulation wiederholen",

  "draft.title": "Ungespeicherte Analyse",
  "draft.saveAs": "Als Szenario in {line} speichern",
  "draft.hint": "Speichere den Entwurf als Szenario, damit er in der Linien-Übersicht erscheint.",

  "szenario.count.one": "{n} Szenario",
  "szenario.count.other": "{n} Szenarien",
  "szenario.new": "Neues Szenario",
  "szenario.default": "Basis-Aufnahme",

  "linien.selectLine": "Linie wählen",
  "linien.newLine": "+ Neue Linie anlegen",
  "linien.name": "Name der Linie",
  "linien.location": "Standort",
  "linien.optionalLabel": "Szenario-Label",
  "linien.optionalLabelHint": "z. B. \"vor Layout-Änderung\", \"nach Griffhöhen-Anpassung\"",

  "video.noClip": "Kein Video verknüpft",
  "video.noClipHint": "Für dieses Szenario wurde noch kein Video hochgeladen.",
};

const EN: Dict = {
  "nav.neueAnalyse": "New Analysis",
  "nav.uebersicht": "Overview",
  "nav.linien": "Lines",
  "nav.ereignisse": "Workshop",
  "nav.automatisierungen": "Automations",
  "nav.einstellungen": "Settings",
  "sidebar.activeLine": "Active Line",
  "sidebar.liveActive": "Live analysis active",
  "sidebar.help": "Help & Support",

  "page.uebersicht.title": "Overview",
  "page.uebersicht.subtitle": "Live analysis",
  "page.linien.title": "Lines",
  "page.ereignisse.title": "Events",
  "page.ereignisse.subtitle": "Cross-line error analysis",
  "page.ereignisse.ranking": "Error rate by line & process step",
  "page.ereignisse.patterns": "Cross-line patterns",
  "page.automatisierungen.title": "Automations",
  "page.automatisierungen.currentState": "Current process state",
  "page.automatisierungen.simulate": "Simulate digital twin",
  "page.automatisierungen.disclaimer":
    "Simplified simulation for demo purposes — not a substitute for real digital-twin validation (e.g. NVIDIA Isaac Sim).",
  "page.einstellungen.title": "Settings",
  "page.einstellungen.theme": "Appearance",
  "page.einstellungen.themeHint": "Switch between light and dark theme.",
  "page.einstellungen.language": "Language",
  "page.einstellungen.languageHint": "Interface language.",
  "theme.light": "Light",
  "theme.dark": "Dark",

  "kpi.throughput": "Throughput",
  "kpi.avgCycle": "Avg cycle time",
  "kpi.errorRate": "Error rate",
  "kpi.downtime": "Downtime",
  "kpi.throughputUnit": "units/min",
  "kpi.cycleUnit": "seconds",
  "kpi.downtimeUnit": "minutes",

  "table.line": "Line",
  "table.step": "Step",
  "table.errorRate": "Error rate",
  "table.dominantCategory": "Dominant category",

  "auto.step.pick": "Pick",
  "auto.step.place": "Place",
  "auto.step.kontrolle": "Inspection",
  "auto.step.korrektur": "Correction",
  "auto.badge.good": "well automatable",
  "auto.badge.limited": "partially automatable",
  "auto.badge.no": "not automatable",
  "auto.card.current": "Current",
  "auto.card.withAutomation": "With automation",
  "auto.metric.takt": "Cycle time",
  "auto.metric.throughput": "Throughput",
  "auto.metric.workload": "Work hours / week",
  "auto.savings": "Estimated savings",

  "btn.save": "Save",
  "btn.discard": "Discard",
  "btn.startAnalysis": "Start analysis",
  "btn.simulate": "Simulate digital twin",
  "btn.simulateAgain": "Run simulation again",

  "draft.title": "Unsaved analysis",
  "draft.saveAs": "Save as scenario in {line}",
  "draft.hint": "Save the draft as a scenario so it appears in the lines overview.",

  "szenario.count.one": "{n} scenario",
  "szenario.count.other": "{n} scenarios",
  "szenario.new": "New scenario",
  "szenario.default": "Base recording",

  "linien.selectLine": "Choose line",
  "linien.newLine": "+ Create new line",
  "linien.name": "Line name",
  "linien.location": "Location",
  "linien.optionalLabel": "Scenario label",
  "linien.optionalLabelHint": "e.g. \"before layout change\", \"after grip-height adjustment\"",

  "video.noClip": "No video linked",
  "video.noClipHint": "No video has been uploaded for this scenario yet.",
};

const DICTS: Record<Lang, Dict> = { de: DE, en: EN };

function fmt(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function useT() {
  const { lang } = useSettings();
  const dict = DICTS[lang];
  return (key: string, vars?: Record<string, string | number>) =>
    fmt(dict[key] ?? DE[key] ?? key, vars);
}
