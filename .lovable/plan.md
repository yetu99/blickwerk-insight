## Problem

The published site (and `id-preview--...lovable.app`) crashes on `/ereignisse`, `/automatisierungen`, `/linien`, `/`, etc. with React minified error **#185** ("Maximum update depth exceeded"). Our root `ErrorComponent` catches it and renders the "This page didn't load" fallback the user sees. SSR HTML is fine (200 OK); the crash happens on client hydration.

## Root cause

`src/lib/runs-store.ts` exposes several `useSyncExternalStore` hooks whose snapshot functions return **new object/array references on every call**. React's `useSyncExternalStore` requires the snapshot to be referentially stable when the underlying state has not changed, otherwise it re-renders forever.

Offending snapshots:
- `useRun` → `getRun()` returns a fresh `{ line, cycles, events }` each call.
- `useActiveSzenario` — stable (returns cached szenarien[id]), but paired with the below.
- `useSzenarienForLine` → builds a new `.map().filter().sort()` array each call.
- `useAllLines` server snapshot `() => serverAllLines` is fine, but `useSzenarienForLine`'s `() => []` and `useRun`'s `() => undefined` server snapshots vary vs. the client snapshot's shape (undefined ↔ real object) which also contributes.
- `useDraft` — stable (returns the module-level `draft`), OK.

React 19 + strict production minification turns the resulting update loop into error #185 immediately, which is why it only shows on the published/preview builds and not in dev.

## Fix

Introduce per-hook cached snapshots keyed by a cheap change token (same pattern already used by `refreshCache` / `cachedAll` for `useAllLines`), so each snapshot function returns the **same reference** until the underlying data actually changes.

Concretely in `src/lib/runs-store.ts`:

1. **`useSzenarienForLine(lineId)`**  
   Add `const szenarienByLineCache: Record<string, { key: string; value: Szenario[] }> = {}`. Compute key as `${(szenarienByLine[lineId] ?? []).join(",")}:${ids.map(id => szenarien[id]?.createdAt).join(",")}`. Return cached array if key unchanged; otherwise rebuild and store.

2. **`useActiveSzenario(lineId)`**  
   Already returns the cached `szenarien[id]` object, so it's stable — no change needed beyond confirming the getServerSnapshot returns the same `undefined` sentinel consistently (it does).

3. **`useRun(lineId)`**  
   Add `const runCache: Record<string, { szId: string | null; lineRef: Line | undefined; value: Seed | undefined }> = {}`. Compute active szenario id + line ref; if both match cached entry, return cached `value`; else rebuild `{ line, cycles, events }` and cache.

4. **`useVideo(szenarioId)`**  
   Already returns `szenarien[szenarioId]?.video`, which is stable (video object is set once). No change.

5. **`useAllLines`**  
   Already cached via `refreshCache`. Leave as is, but include `activeSzenarioByLine` changes in `keyForCache` only if we surface them (we don't in the list item shape — no change needed).

6. **Server snapshots**  
   Replace inline `() => []`, `() => undefined`, `() => null` arrow factories with module-level constants (`const EMPTY_SZENARIEN: Szenario[] = []`, `const UNDEF = undefined`) passed as `() => EMPTY_SZENARIEN` etc., so the server-snapshot value is identity-stable across renders (belt-and-suspenders — arrow returning primitive is fine, but returning `[]` literal is not).

7. **Invalidation**  
   All caches are invalidated implicitly the next time their key changes; `emit()` triggers React to re-read, the key differs, and a new stable reference is produced. No changes needed in `setDraft`/`clearDraft`/`saveDraftAsSzenario`.

After the fix, verify by loading `/`, `/linien`, `/linien/line-1`, `/ereignisse`, `/automatisierungen`, `/einstellungen`, and `/neue-analyse` in a headless browser against the running dev server AND the built preview (`bun run build && bun run preview` if available, or by pushing) — expect no React #185 errors in the console and no "This page didn't load" fallback.

## Out of scope

- The unrelated `data-tsd-source` hydration mismatch warning (dev-only tracker attribute) — not related to the crash.
- Refactoring the store to a proper state library (zustand/redux); the cache pattern is sufficient for this demo.
