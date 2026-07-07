import { useSyncExternalStore } from "react";
import {
  LINES,
  SEEDS,
  type Cycle,
  type Line,
  type ProcessEvent,
  type Seed,
} from "./mock-data";

export interface VideoAsset {
  url: string;
  durationSec: number;
  filename: string;
  sizeBytes: number;
}

export interface Szenario {
  id: string;
  lineId: string;
  label: string;
  createdAt: number;
  cycles: Cycle[];
  events: ProcessEvent[];
  video?: VideoAsset;
}

export interface SavedLine extends Line {
  savedAt: number;
}

export interface Draft {
  targetLineId: string | null; // null → create new line from newLine
  newLine: { name: string; location: string } | null;
  label: string;
  cycles: Cycle[];
  events: ProcessEvent[];
  video: VideoAsset;
  createdAt: number;
}

// ---------- Storage ----------
const extraLines: SavedLine[] = [];
// szenarien indexed by szenario id, plus per-line ordered index for lookup.
const szenarien: Record<string, Szenario> = {};
const szenarienByLine: Record<string, string[]> = {}; // lineId → szenarioId[]
const activeSzenarioByLine: Record<string, string> = {}; // lineId → szenarioId
let draft: Draft | null = null;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// ---------- Seed initialization ----------
function initSeeds() {
  for (const line of LINES) {
    const seed = SEEDS[line.id];
    if (!seed) continue;
    const id = `${line.id}-base`;
    const sz: Szenario = {
      id,
      lineId: line.id,
      label: "Basis-Aufnahme",
      createdAt: Date.now() - 24 * 60 * 60 * 1000,
      cycles: seed.cycles,
      events: seed.events,
    };
    szenarien[id] = sz;
    szenarienByLine[line.id] = [id];
    activeSzenarioByLine[line.id] = id;
  }
}
initSeeds();

// ---------- Lookup helpers ----------
export function getAllLines(): SavedLine[] {
  const seeds: SavedLine[] = LINES.map((l) => ({ ...l, savedAt: 0 }));
  return [...seeds, ...extraLines];
}

export function getLine(lineId: string): Line | undefined {
  return getAllLines().find((l) => l.id === lineId);
}

export function getSzenarienForLine(lineId: string): Szenario[] {
  const ids = szenarienByLine[lineId] ?? [];
  return ids
    .map((id) => szenarien[id])
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getSzenario(id: string): Szenario | undefined {
  return szenarien[id];
}

export function getActiveSzenario(lineId: string): Szenario | undefined {
  const id = activeSzenarioByLine[lineId];
  if (!id) return getSzenarienForLine(lineId)[0];
  return szenarien[id];
}

export function setActiveSzenario(lineId: string, szenarioId: string) {
  if (!szenarien[szenarioId]) return;
  activeSzenarioByLine[lineId] = szenarioId;
  emit();
}

// Back-compat: return a Seed shape for the active szenario of a line.
export function getRun(lineId: string): Seed | undefined {
  const sz = getActiveSzenario(lineId);
  const line = getLine(lineId);
  if (!sz || !line) return undefined;
  return { line, cycles: sz.cycles, events: sz.events };
}

// ---------- Reactive hooks ----------
export function useRun(lineId: string): Seed | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getRun(lineId),
    () => undefined,
  );
}

export function useActiveSzenario(lineId: string): Szenario | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getActiveSzenario(lineId),
    () => undefined,
  );
}

export function useSzenarienForLine(lineId: string): Szenario[] {
  return useSyncExternalStore(
    subscribe,
    () => getSzenarienForLine(lineId),
    () => [],
  );
}

// Video for a szenario id.
export function useVideo(szenarioId: string): VideoAsset | undefined {
  return useSyncExternalStore(
    subscribe,
    () => szenarien[szenarioId]?.video,
    () => undefined,
  );
}

// ---------- Line list ----------
export interface LineListItem {
  line: Line;
  savedAt: number | null;
  szenarienCount: number;
  latestSzenario: Szenario | null;
}

function snapshotAllLines(): LineListItem[] {
  const items: LineListItem[] = [];
  for (const l of LINES) {
    const sz = getSzenarienForLine(l.id);
    items.push({
      line: l,
      savedAt: null,
      szenarienCount: sz.length,
      latestSzenario: sz[0] ?? null,
    });
  }
  for (const l of extraLines) {
    const sz = getSzenarienForLine(l.id);
    items.push({
      line: l,
      savedAt: l.savedAt,
      szenarienCount: sz.length,
      latestSzenario: sz[0] ?? null,
    });
  }
  return items;
}

let cachedAll: LineListItem[] = snapshotAllLines();
let cacheKey = keyForCache();
function keyForCache() {
  return `${extraLines.length}:${Object.keys(szenarien).length}:${
    extraLines[extraLines.length - 1]?.savedAt ?? 0
  }:${Object.values(szenarien).reduce((n, s) => n + s.createdAt, 0)}`;
}
function refreshCache() {
  const k = keyForCache();
  if (k !== cacheKey) {
    cacheKey = k;
    cachedAll = snapshotAllLines();
  }
  return cachedAll;
}
const serverAllLines: LineListItem[] = snapshotAllLines();

export function useAllLines(): LineListItem[] {
  return useSyncExternalStore(subscribe, refreshCache, () => serverAllLines);
}

// ---------- Draft ----------
export function setDraft(next: Draft) {
  draft = next;
  emit();
}
export function clearDraft() {
  if (draft) {
    const url = draft.video.url;
    const stillUsed = Object.values(szenarien).some((s) => s.video?.url === url);
    if (!stillUsed) {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
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
 * Materialize the current draft into a Szenario under an existing or newly
 * created Linie. Returns { lineId, szenarioId } or null when no draft.
 */
export function saveDraftAsSzenario(): { lineId: string; szenarioId: string } | null {
  if (!draft) return null;
  let lineId = draft.targetLineId;
  // Create new line if requested.
  if (!lineId && draft.newLine) {
    const rand3 = String(Math.floor(100 + Math.random() * 900));
    const id = `custom-${Date.now().toString(36)}-${rand3}`;
    const line: SavedLine = {
      id,
      name: draft.newLine.name.trim() || "Unbenannte Linie",
      location: draft.newLine.location.trim() || "—",
      camera_id: `CAM-DRAFT-${rand3}`,
      savedAt: Date.now(),
    };
    extraLines.push(line);
    szenarienByLine[id] = [];
    lineId = id;
  }
  if (!lineId) return null;

  const szenarioId = `sz-${Date.now().toString(36)}-${Math.floor(
    Math.random() * 1000,
  )}`;
  const label =
    draft.label.trim() ||
    `Aufnahme vom ${new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`;

  const sz: Szenario = {
    id: szenarioId,
    lineId,
    label,
    createdAt: Date.now(),
    cycles: draft.cycles.map((c) => ({ ...c, line_id: lineId! })),
    events: draft.events.map((e) => ({ ...e, line_id: lineId! })),
    video: draft.video,
  };
  szenarien[szenarioId] = sz;
  szenarienByLine[lineId] = [szenarioId, ...(szenarienByLine[lineId] ?? [])];
  activeSzenarioByLine[lineId] = szenarioId;
  draft = null;
  emit();
  return { lineId, szenarioId };
}
