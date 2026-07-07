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
    "Flasche fiel beim Aufnehmen aus dem Greifer.",
    "Greifer erfasste Flasche seitlich, Position korrigiert.",
    "Zweiter Griffversuch nach Fehlpositionierung nötig.",
  ],
  Farbverwechslung: [
    "Grüne Flasche im Fach für Braunglas erkannt.",
    "Braune Flasche im Weißglas-Kasten platziert.",
    "Sortierabweichung: falsche Farbzuordnung Position 4.",
  ],
  Taktzeitueberschreitung: [
    "Zyklus überschritt Zielzeit von 6.0 s deutlich.",
    "Verlängerte Dauer durch Nachjustierung des Greifarms.",
    "Taktzeit über Schwellwert – Ursache unklar.",
  ],
  Zoegern: [
    "Bediener verharrte 3.2 s vor Kastenwechsel.",
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

// Deterministic PRNG so seed data is stable across renders.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LINE: Line = {
  id: "line-1",
  name: "Flaschensortierung Kasten 1",
  location: "Halle 2 · Linie A",
  camera_id: "CAM-A-014",
};

interface Seed {
  line: Line;
  cycles: Cycle[];
  events: ProcessEvent[];
}

function generate(): Seed {
  const rand = mulberry32(42);
  const cycles: Cycle[] = [];
  const events: ProcessEvent[] = [];

  // Anchor: 2h window ending "now" but rounded.
  const end = Date.now();
  const start = end - 2 * 60 * 60 * 1000;
  const total = 200;

  let cursor = start;
  const categories: EventCategory[] = [
    "Fehlgriff",
    "Farbverwechslung",
    "Taktzeitueberschreitung",
    "Zoegern",
    "Prozessunterbrechung",
  ];

  for (let i = 0; i < total; i++) {
    // Base 4-6s, occasional outlier up to 12s.
    let duration = 4 + rand() * 2;
    const isOutlier = rand() < 0.06;
    if (isOutlier) duration = 7 + rand() * 5;

    const isError = rand() < 0.15;
    const startTs = cursor;
    const endTs = startTs + duration * 1000;
    const cycle: Cycle = {
      id: `c-${i + 1}`,
      line_id: LINE.id,
      start_ts: startTs,
      end_ts: endTs,
      duration_sec: Math.round(duration * 100) / 100,
      status: isError ? "error" : "ok",
    };
    cycles.push(cycle);

    if (isError) {
      // Weight taktzeit events toward long cycles.
      let category: EventCategory;
      if (duration > 7) {
        category = "Taktzeitueberschreitung";
      } else {
        category = categories[Math.floor(rand() * categories.length)];
      }
      const sevs = SEVERITY_BY_CATEGORY[category];
      const severity = sevs[Math.floor(rand() * sevs.length)];
      const descs = CATEGORY_DESCRIPTIONS[category];
      const description = descs[Math.floor(rand() * descs.length)];
      events.push({
        id: `e-${events.length + 1}`,
        cycle_id: cycle.id,
        category,
        severity,
        timestamp: startTs + Math.floor(duration * 500),
        description,
        video_clip_url: null,
      });
    }

    // small idle gap
    cursor = endTs + (rand() < 0.05 ? 8000 + rand() * 15000 : 200 + rand() * 400);
    if (cursor > end) break;
  }

  return { line: LINE, cycles, events };
}

export const SEED = generate();

// Derived KPIs
export function computeKpis(cycles: Cycle[], events: ProcessEvent[]) {
  const durations = cycles.map((c) => c.duration_sec);
  const avgCycle = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

  const windowStart = cycles[0]?.start_ts ?? Date.now();
  const windowEnd = cycles[cycles.length - 1]?.end_ts ?? Date.now();
  const windowMinutes = Math.max(1, (windowEnd - windowStart) / 60000);
  const throughput = cycles.length / windowMinutes;

  const errorRate = (events.length / Math.max(1, cycles.length)) * 100;

  // Downtime = large gaps between cycles + Prozessunterbrechung count * ~15s
  let gapMs = 0;
  for (let i = 1; i < cycles.length; i++) {
    const gap = cycles[i].start_ts - cycles[i - 1].end_ts;
    if (gap > 5000) gapMs += gap;
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
