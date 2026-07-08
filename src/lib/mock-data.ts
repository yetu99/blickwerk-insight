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
  video_timestamp_start?: number;
  video_timestamp_end?: number;
}


export type ClusterSource =
  | "waiting"
  | "timwoods_motion"
  | "timwoods_overprocessing"
  | "timwoods_defects"
  | "timwoods_skills"
  | "tracker";

export const CATEGORY_TO_CLUSTER: Record<EventCategory, ClusterSource> = {
  Fehlgriff: "timwoods_motion",
  Farbverwechslung: "timwoods_defects",
  Taktzeitueberschreitung: "tracker",
  Zoegern: "timwoods_skills",
  Prozessunterbrechung: "waiting",
};

export const CLUSTER_LABELS: Record<ClusterSource, string> = {
  waiting: "Warten",
  timwoods_motion: "TIMWOODS · Bewegung",
  timwoods_overprocessing: "TIMWOODS · Überbearbeitung",
  timwoods_defects: "TIMWOODS · Fehler",
  timwoods_skills: "TIMWOODS · Fähigkeiten",
  tracker: "Tracker",
};

export interface ProcessEvent {
  id: string;
  line_id: string;
  cycle_id: string;
  category: EventCategory;
  severity: Severity;
  timestamp: number;
  description: string;
  video_clip_url: string | null;
  cluster_source: ClusterSource;
  confidence: number;
  human_checkpoint_required: boolean;
  video_timestamp_start?: number;
  video_timestamp_end?: number;
}



export const CATEGORY_LABELS: Record<EventCategory, string> = {
  Fehlgriff: "Fehlgriff",
  Farbverwechslung: "Farbverwechslung",
  Taktzeitueberschreitung: "Taktzeitüberschreitung",
  Zoegern: "Zögern",
  Prozessunterbrechung: "Prozessunterbrechung",
};

export type ProcessStep = "Pick" | "Place" | "Kontrolle" | "Korrektur";

export const CATEGORY_TO_STEP: Record<EventCategory, ProcessStep> = {
  Fehlgriff: "Pick",
  Zoegern: "Pick",
  Taktzeitueberschreitung: "Place",
  Farbverwechslung: "Kontrolle",
  Prozessunterbrechung: "Korrektur",
};

export const PROCESS_STEPS: ProcessStep[] = ["Pick", "Place", "Kontrolle", "Korrektur"];

export const STEP_WEIGHTS: Record<ProcessStep, number> = {
  Pick: 0.32,
  Place: 0.28,
  Kontrolle: 0.22,
  Korrektur: 0.18,
};

export interface StepTimeInfo {
  step: ProcessStep;
  minSec: number;
  maxSec: number;
  avgSec: number;
}

/**
 * Compute per-step time min/max/avg by distributing each cycle's duration
 * across the four process steps using fixed weights. Reused by both the
 * Übersicht flow diagram and the Automatisierungen "Prozess-Ist-Zustand".
 */
export function computeStepTimes(cycles: Cycle[]): StepTimeInfo[] {
  if (!cycles.length) {
    return PROCESS_STEPS.map((step) => ({ step, minSec: 0, maxSec: 0, avgSec: 0 }));
  }
  const durations = cycles.map((c) => c.duration_sec);
  const minD = Math.min(...durations);
  const maxD = Math.max(...durations);
  const avgD = durations.reduce((a, b) => a + b, 0) / durations.length;
  return PROCESS_STEPS.map((step) => {
    const w = STEP_WEIGHTS[step];
    return {
      step,
      minSec: minD * w,
      maxSec: maxD * w,
      avgSec: avgD * w,
    };
  });
}

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

export interface Seed {
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
      const confidence = rand() < 0.15
        ? 0.4 + rand() * 0.2 // occasional low-confidence
        : 0.7 + rand() * 0.25;
      const confRounded = Math.round(confidence * 100) / 100;
      const human_checkpoint_required =
        confRounded < 0.6 && (severity === "medium" || severity === "high");
      events.push({
        id: `${line.id}-e-${events.length + 1}`,
        line_id: line.id,
        cycle_id: cycle.id,
        category,
        severity,
        timestamp: startTs + Math.floor(duration * 500),
        description,
        video_clip_url: null,
        cluster_source: CATEGORY_TO_CLUSTER[category],
        confidence: confRounded,
        human_checkpoint_required,
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

/**
 * Generate a fresh (non-deterministic) analysis run for a line.
 * Cycles are packed sequentially inside [0, videoDurationSec] at ~3-6s each
 * with light gaps. Wall-clock timestamps map the video window to end "now"
 * so existing time-range filters still work.
 */
export function generateRun(lineId: string, videoDurationSec: number): Seed {
  const line = LINES.find((l) => l.id === lineId) ?? LINES[0];
  const runId = Math.floor(Math.random() * 1_000_000);
  const errorRate = 0.12 + Math.random() * 0.06;

  const wallEnd = Date.now();
  const wallStart = wallEnd - Math.round(videoDurationSec * 1000);

  const cycles: Cycle[] = [];
  const events: ProcessEvent[] = [];

  let cursor = 0;
  let i = 0;
  while (cursor < videoDurationSec - 1) {
    const duration = 3 + Math.random() * 3; // 3..6s
    let vStart = cursor;
    let vEnd = Math.min(videoDurationSec, cursor + duration);
    // small gap between cycles
    cursor = vEnd + Math.random() * 0.6;

    const startTs = wallStart + Math.round(vStart * 1000);
    const endTs = wallStart + Math.round(vEnd * 1000);
    const actualDur = Math.round((vEnd - vStart) * 100) / 100;

    const isError = Math.random() < errorRate;
    const cycle: Cycle = {
      id: `run-${runId}-c-${++i}`,
      line_id: line.id,
      start_ts: startTs,
      end_ts: endTs,
      duration_sec: actualDur,
      status: isError ? "error" : "ok",
      video_timestamp_start: Math.round(vStart * 100) / 100,
      video_timestamp_end: Math.round(vEnd * 100) / 100,
    };
    cycles.push(cycle);

    if (isError) {
      let category: EventCategory;
      if (actualDur > 5.5) {
        category = "Taktzeitueberschreitung";
      } else {
        category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      }
      const sevs = SEVERITY_BY_CATEGORY[category];
      const severity = sevs[Math.floor(Math.random() * sevs.length)];
      const descs = CATEGORY_DESCRIPTIONS[category];
      const description = descs[Math.floor(Math.random() * descs.length)];
      const rawConf =
        Math.random() < 0.15 ? 0.4 + Math.random() * 0.2 : 0.7 + Math.random() * 0.25;
      const confidence = Math.round(rawConf * 100) / 100;
      const human_checkpoint_required =
        confidence < 0.6 && (severity === "medium" || severity === "high");

      // Event spans a sub-window inside the cycle.
      const evStartRel = vStart + (vEnd - vStart) * 0.25;
      const evEndRel = Math.min(vEnd, evStartRel + 0.8 + Math.random() * 1.5);
      events.push({
        id: `run-${runId}-e-${events.length + 1}`,
        line_id: line.id,
        cycle_id: cycle.id,
        category,
        severity,
        timestamp: wallStart + Math.round(evStartRel * 1000),
        description,
        video_clip_url: null,
        cluster_source: CATEGORY_TO_CLUSTER[category],
        confidence,
        human_checkpoint_required,
        video_timestamp_start: Math.round(evStartRel * 100) / 100,
        video_timestamp_end: Math.round(evEndRel * 100) / 100,
      });
    }
  }


  cycles.sort((a, b) => a.start_ts - b.start_ts);
  events.sort((a, b) => a.timestamp - b.timestamp);
  return { line, cycles, events };
}

