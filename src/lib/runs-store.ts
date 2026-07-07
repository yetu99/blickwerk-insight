import { useSyncExternalStore } from "react";
import type { Seed } from "./mock-data";

export interface VideoAsset {
  url: string; // object URL
  durationSec: number;
  filename: string;
  sizeBytes: number;
}

const runs: Record<string, Seed> = {};
const videos: Record<string, VideoAsset> = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setRun(lineId: string, seed: Seed) {
  runs[lineId] = seed;
  emit();
}

export function getRun(lineId: string): Seed | undefined {
  return runs[lineId];
}

export function setVideo(lineId: string, asset: VideoAsset) {
  // revoke previous URL to avoid leaks
  const prev = videos[lineId];
  if (prev && prev.url !== asset.url) {
    try {
      URL.revokeObjectURL(prev.url);
    } catch {
      /* noop */
    }
  }
  videos[lineId] = asset;
  emit();
}

export function getVideo(lineId: string): VideoAsset | undefined {
  return videos[lineId];
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

export function useVideo(lineId: string): VideoAsset | undefined {
  return useSyncExternalStore(
    subscribe,
    () => videos[lineId],
    () => undefined,
  );
}
