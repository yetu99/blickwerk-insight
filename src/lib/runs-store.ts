import { useSyncExternalStore } from "react";
import type { Seed } from "./mock-data";

const runs: Record<string, Seed> = {};
const listeners = new Set<() => void>();

export function setRun(lineId: string, seed: Seed) {
  runs[lineId] = seed;
  listeners.forEach((l) => l());
}

export function getRun(lineId: string): Seed | undefined {
  return runs[lineId];
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useRun(lineId: string): Seed | undefined {
  return useSyncExternalStore(
    subscribe,
    () => runs[lineId],
    () => undefined,
  );
}
