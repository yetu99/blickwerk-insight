export type EventCategory =
  | "Fehlgriff"
  | "Farbverwechslung"
  | "Taktzeitueberschreitung"
  | "Zoegern"
  | "Prozessunterbrechung";

export type Severity = "low" | "medium" | "high";

export interface Line {
  id: string;
  name: string;
  location: string;
  camera_id: string;
}

export interface Cycle {
  id: string;
  line_id: string;
  start_ts: number;
  end_ts: number;
  duration_sec: number;
  status: "ok" | "error";
}

export interface ProcessEvent {
  id: string;
  line_id: string;
  cycle_id: string;
  category: EventCategory;
  severity: Severity;
  timestamp: number;
  description: string;
  video_clip_url: string | null;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  Fehlgriff: "Fehlgriff",
  Farbverwechslung: "Farbverwechslung",
  Taktzeitueberschreitung: "Taktzeitüberschreitung",
  Zoegern: "Zögern",
  Prozessunterbrechung: "Prozessunterbrechung",
};

const CATEGORY_DESCRIPTIONS: Record<EventCategory, string[]> = {
  Fehlgriff: [
    "Bauteil fiel beim Aufnehmen aus dem Greifer.",
    "Greifer erfasste Teil seitlich, Position korrigiert.",
    "Zweiter Griffversuch nach Fehlpositionierung nötig.",
  ],
  Farbverwechslung: [
    "Grüne Flasche im Fach für Braunglas erkannt.",
    "Braune Flasche im Weißglas-Kasten platziert.",
    "Sortierabweichung: falsche Farbzuordnung Position 4.",
  ],
  Taktzeitueberschreitung: [
    "Zyklus überschritt Zielzeit deutlich.",
    "Verlängerte Dauer durch Nachjustierung.",
    "Taktzeit über Schwellwert – Ursache unklar.",
  ],
  Zoegern: [
    "Bediener verharrte 3.2 s vor Übergabe.",
    "Unterbrechung im Bewegungsablauf am Übergabepunkt.",
    "Zögern erkannt: Blick zur Anzeige während des Griffs.",
  ],
  Prozessunterbrechung: [
    "Förderband für 12 s ohne erkennbare Ursache gestoppt.",
    "Bediener verließ Sichtfeld während laufender Sortierung.",
    "Manueller Eingriff am Bandantrieb erforderlich.",
  ],
};

const SEVERITY_BY_CATEGORY: Record<EventCategory, Severity[]> = {
  Fehlgriff: ["medium", "high"],
  Farbverwechslung: ["high", "high", "medium"],
  Taktzeitueberschreitung: ["low", "medium"],
  Zoegern: ["low", "low", "medium"],
  Prozessunterbrechung: ["high", "medium"],
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LINES: Line[] = [
  {
    id: "line-1",
    name: "Flaschensortierung Kasten 1",
    location: "Halle 2 · Linie A",
    camera_id: "CAM-A-014",
  },
  {
    id: "line-2",
    name: "Montage Station 3",
    location: "Halle 1 · Linie C",
    camera_id: "CAM-C-007",
  },
  {
    id: "line-3",
    name: "Kommissionierung Halle B",
    location: "Halle B · Zone 2",
    camera_id: "CAM-B-021",
  },
];

// Fallback for legacy imports.
export const LINE: Line = LINES[0];

interface LineConfig {
  seed: number;
  baseDuration: number; // seconds
  jitter: number; // additional seconds
  errorRate: number; // 0..1
  dominantCategory: EventCategory;
  dominantWeight: number; // 0..1 chance to pick dominant
  cycleCount: number;
}

const LINE_CONFIG: Record<string, LineConfig> = {
  "line-1": {
    seed: 42,
    baseDuration: 4,
    jitter: 2,
    errorRate: 0.15,
    dominantCategory: "Farbverwechslung",
    dominantWeight: 0.45,
    cycleCount: 200,
  },
  "line-2": {
    seed: 137,
    baseDuration: 11,
    jitter: 4,
    errorRate: 0.09,
    dominantCategory: "Fehlgriff",
    dominantWeight: 0.55,
    cycleCount: 90,
  },
  "line-3": {
    seed: 911,
    baseDuration: 7,
    jitter: 3,
    errorRate: 0.22,
    dominantCategory: "Zoegern",
    dominantWeight: 0.5,
    cycleCount: 140,
  },
};

interface Seed {
  line: Line;
  cycles: Cycle[];
  events: ProcessEvent[];
}

const CATEGORIES: EventCategory[] = [
  "Fehlgriff",
  "Farbverwechslung",
  "Taktzeitueberschreitung",
  "Zoegern",
  "Prozessunterbrechung",
];

function generateLine(line: Line, cfg: LineConfig): Seed {
  const rand = mulberry32(cfg.seed);
  const cycles: Cycle[] = [];
  const events: ProcessEvent[] = [];

  // 7-day window ending "now" so the "last 7 days" preset shows data.
  const end = Date.now();
  const start = end - 7 * 24 * 60 * 60 * 1000;
  const span = end - start;

  // Distribute cycles across the full 7-day span with denser sampling
  // in the last 2 hours so the default view is always populated.
  const recentWindow = 2 * 60 * 60 * 1000;
  const recentShare = 0.55; // ~55% of cycles fall in last 2h

  for (let i = 0; i < cfg.cycleCount; i++) {
    let startTs: number;
    if (rand() < recentShare) {
      startTs = end - Math.floor(rand() * recentWindow);
    } else {
      startTs = start + Math.floor(rand() * (span - recentWindow));
    }

    let duration = cfg.baseDuration + rand() * cfg.jitter;
    const isOutlier = rand() < 0.06;
    if (isOutlier) duration = cfg.baseDuration + cfg.jitter + rand() * 6;

    const isError = rand() < cfg.errorRate;
    const endTs = startTs + duration * 1000;

    const cycle: Cycle = {
      id: `${line.id}-c-${i + 1}`,
      line_id: line.id,
      start_ts: startTs,
      end_ts: endTs,
      duration_sec: Math.round(duration * 100) / 100,
      status: isError ? "error" : "ok",
    };
    cycles.push(cycle);

    if (isError) {
      let category: EventCategory;
      if (duration > cfg.baseDuration + cfg.jitter) {
        category = "Taktzeitueberschreitung";
      } else if (rand() < cfg.dominantWeight) {
        category = cfg.dominantCategory;
      } else {
        category = CATEGORIES[Math.floor(rand() * CATEGORIES.length)];
      }
      const sevs = SEVERITY_BY_CATEGORY[category];
      const severity = sevs[Math.floor(rand() * sevs.length)];
      const descs = CATEGORY_DESCRIPTIONS[category];
      const description = descs[Math.floor(rand() * descs.length)];
      events.push({
        id: `${line.id}-e-${events.length + 1}`,
        line_id: line.id,
        cycle_id: cycle.id,
        category,
        severity,
        timestamp: startTs + Math.floor(duration * 500),
        description,
        video_clip_url: null,
      });
    }
  }

  cycles.sort((a, b) => a.start_ts - b.start_ts);
  events.sort((a, b) => a.timestamp - b.timestamp);
  return { line, cycles, events };
}

export const SEEDS: Record<string, Seed> = Object.fromEntries(
  LINES.map((l) => [l.id, generateLine(l, LINE_CONFIG[l.id])]),
);

// Legacy default export used by any single-line consumer.
export const SEED: Seed = SEEDS[LINES[0].id];

export function getSeed(lineId: string): Seed {
  return SEEDS[lineId] ?? SEED;
}

export function filterByRange<T extends { start_ts?: number; timestamp?: number }>(
  items: T[],
  from: number,
  to: number,
): T[] {
  return items.filter((it) => {
    const t = it.start_ts ?? it.timestamp ?? 0;
    return t >= from && t <= to;
  });
}

export function computeKpis(cycles: Cycle[], events: ProcessEvent[]) {
  const durations = cycles.map((c) => c.duration_sec);
  const avgCycle = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

  const windowStart = cycles[0]?.start_ts ?? Date.now();
  const windowEnd = cycles[cycles.length - 1]?.end_ts ?? Date.now();
  const windowMinutes = Math.max(1, (windowEnd - windowStart) / 60000);
  const throughput = cycles.length / windowMinutes;

  const errorRate = (events.length / Math.max(1, cycles.length)) * 100;

  let gapMs = 0;
  const sorted = [...cycles].sort((a, b) => a.start_ts - b.start_ts);
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].start_ts - sorted[i - 1].end_ts;
    if (gap > 5000 && gap < 30 * 60 * 1000) gapMs += gap;
  }
  const downtimeMin = gapMs / 60000;

  return {
    throughput: Math.round(throughput * 10) / 10,
    avgCycle: Math.round(avgCycle * 100) / 100,
    errorRate: Math.round(errorRate * 10) / 10,
    downtimeMin: Math.round(downtimeMin * 10) / 10,
  };
}

export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type RangePresetId = "2h" | "today" | "7d";

export interface RangePreset {
  id: RangePresetId;
  label: string;
  compute: () => { from: number; to: number };
}

export const RANGE_PRESETS: RangePreset[] = [
  {
    id: "2h",
    label: "Letzte 2 Stunden",
    compute: () => {
      const to = Date.now();
      return { from: to - 2 * 60 * 60 * 1000, to };
    },
  },
  {
    id: "today",
    label: "Heute",
    compute: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return { from, to: now.getTime() };
    },
  },
  {
    id: "7d",
    label: "Letzte 7 Tage",
    compute: () => {
      const to = Date.now();
      return { from: to - 7 * 24 * 60 * 60 * 1000, to };
    },
  },
];
