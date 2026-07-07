import { useSyncExternalStore } from "react";
import { LINES, type Cycle, type Line, type ProcessEvent, type Seed } from "./mock-data";

export interface VideoAsset {
  url: string;
  durationSec: number;
  filename: string;
  sizeBytes: number;
}

export interface Draft {
  processName: string;
  location: string;
  cycles: Cycle[];
  events: ProcessEvent[];
  video: VideoAsset;
  createdAt: number;
}

export interface SavedLine extends Line {
  savedAt: number;
}

const runs: Record<string, Seed> = {};
const videos: Record<string, VideoAsset> = {};
const extraLines: SavedLine[] = [];
let draft: Draft | null = null;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ---------- Runs & videos (per line) ----------

export function setRun(lineId: string, seed: Seed) {
  runs[lineId] = seed;
  emit();
}
export function getRun(lineId: string): Seed | undefined {
  return runs[lineId];
}
export function useRun(lineId: string): Seed | undefined {
  return useSyncExternalStore(subscribe, () => runs[lineId], () => undefined);
}

export function setVideo(lineId: string, asset: VideoAsset) {
  const prev = videos[lineId];
  if (prev && prev.url !== asset.url) {
    try { URL.revokeObjectURL(prev.url); } catch { /* noop */ }
  }
  videos[lineId] = asset;
  emit();
}
export function getVideo(lineId: string): VideoAsset | undefined {
  return videos[lineId];
}
export function useVideo(lineId: string): VideoAsset | undefined {
  return useSyncExternalStore(subscribe, () => videos[lineId], () => undefined);
}

// ---------- Draft (unsaved analysis) ----------

export function setDraft(next: Draft) {
  draft = next;
  emit();
}
export function clearDraft() {
  if (draft) {
    // Only revoke if the video isn't also attached to a saved line.
    const stillUsed = Object.values(videos).some((v) => v.url === draft!.video.url);
    if (!stillUsed) {
      try { URL.revokeObjectURL(draft.video.url); } catch { /* noop */ }
    }
  }
  draft = null;
  emit();
}
export function useDraft(): Draft | null {
  return useSyncExternalStore(subscribe, () => draft, () => null);
}
export function getDraft(): Draft | null {
  return draft;
}

/**
 * Materialize the current draft into a real saved Linie.
 * Returns the new line id, or null if there's no draft.
 */
export function saveDraftAsLine(): string | null {
  if (!draft) return null;
  const rand3 = String(Math.floor(100 + Math.random() * 900));
  const id = `custom-${Date.now().toString(36)}-${rand3}`;
  const line: SavedLine = {
    id,
    name: draft.processName.trim() || "Unbenannte Linie",
    location: draft.location.trim() || "—",
    camera_id: `CAM-DRAFT-${rand3}`,
    savedAt: Date.now(),
  };
  extraLines.push(line);
  runs[id] = {
    line,
    cycles: draft.cycles.map((c) => ({ ...c, line_id: id })),
    events: draft.events.map((e) => ({ ...e, line_id: id })),
  };
  videos[id] = draft.video;
  draft = null;
  emit();
  return id;
}

// ---------- Lines list ----------

export interface LineListItem {
  line: Line;
  savedAt: number | null; // null = original seed
}

function snapshotAllLines(): LineListItem[] {
  return [
    ...LINES.map((l) => ({ line: l, savedAt: null as number | null })),
    ...extraLines.map((l) => ({ line: l as Line, savedAt: l.savedAt })),
  ];
}

// Reactive list of all lines (seeds + saved drafts).
export function useAllLines(): LineListItem[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      // Return a stable-ish snapshot: recompute only when extraLines change.
      // useSyncExternalStore requires reference equality, so cache by length+lastSaved.
      return snapshotCache();
    },
    () => snapshotSeedOnly(),
  );
}

let cachedSnapshot: LineListItem[] = [];
let cachedKey = "";
function snapshotCache(): LineListItem[] {
  const key = `${extraLines.length}:${extraLines[extraLines.length - 1]?.savedAt ?? 0}`;
  if (key !== cachedKey) {
    cachedKey = key;
    cachedSnapshot = snapshotAllLines();
  }
  return cachedSnapshot;
}
let seedOnlyCache: LineListItem[] | null = null;
function snapshotSeedOnly(): LineListItem[] {
  if (!seedOnlyCache) {
    seedOnlyCache = LINES.map((l) => ({ line: l, savedAt: null }));
  }
  return seedOnlyCache;
}
