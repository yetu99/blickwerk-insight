## Overview

Five sequential changes to the symplify dashboard: restructure Linien as a two-level hierarchy (Linie → Szenarien), embed a full video player with event markers in the event feed, repurpose the Ereignisse tab as cross-line analytics, add an Automatisierungen tab with a mocked digital-twin simulation, and build out Einstellungen with theme + language toggles.

---

## 1) Linie → Szenario hierarchy

**Data model (`src/lib/runs-store.ts`, `src/lib/mock-data.ts`)**
- New type `Szenario`: `{ id, lineId, label?, createdAt, cycles, events, video? }`.
- `SavedLine` becomes a pure physical station: `{ id, name, location, camera_id, createdAt }` — no cycles/events attached directly.
- Replace `runs[lineId]: Seed` with `szenarien: Record<lineId, Szenario[]>`, plus `activeSzenarioByLine: Record<lineId, szenarioId>` so the dashboard knows which Szenario to render per Linie.
- Videos move from `videos[lineId]` to `videos[szenarioId]`.
- `Draft` gains `targetLineId | null` and `label?`; helper `saveDraftAsSzenario(lineId)` replaces `saveDraftAsLine` (kept as thin wrapper that creates a new Linie + one Szenario when the user picks "+ Neue Linie anlegen").
- Seed data: wrap each existing seed line's cycles/events into one default Szenario ("Basis-Aufnahme").

**Neue Analyse (`src/routes/neue-analyse.tsx`)**
- Replace the "Bezeichnung für diesen Prozess" text input with:
  - Linie dropdown (existing Linien) + "+ Neue Linie anlegen" option that expands inline Name + Standort fields.
  - Optional "Szenario-Label" text field (e.g. "vor Layout-Änderung").
- On pipeline complete, draft stores `targetLineId` (or `newLine` payload) and `label`.

**Draft banner (`src/routes/index.tsx`)**
- Text becomes "Als Szenario in {Linie-Name} speichern"; save calls `saveDraftAsSzenario`.

**Linien page (`src/routes/linien.tsx`)**
- Top level: Linie cards showing name, Standort, `{n} Szenarien`, most-recent Szenario's KPI snapshot.
- Clicking a Linie navigates to `/linien/$lineId` — a new route showing a chronological Szenario list (newest first), each with label + timestamp + mini-KPIs.
- Clicking a Szenario navigates to `/?line={lineId}&szenario={szenarioId}` which sets it as the active Szenario and loads its data into Übersicht.

**Header line selector** — becomes Linie + Szenario (two-level or single combo grouped by Linie); secondary shortcut only.

---

## 2) Full video player with event markers

**Refactor `event-video-player.tsx` → `szenario-video-player.tsx`**
- Always-visible full-length player (no ±5s window clamp).
- Custom scrubber overlay: absolutely-positioned category-colored dot markers at `event.video_timestamp_start / videoDuration * 100%`, reusing the 5 CATEGORY_COLOR classes.
- Marker hover → tooltip with category label + short description (radix Tooltip).
- Marker click → seek video + emit `onSeek(event)` that highlights a shaded region (`left/width %` overlay, ~200ms fade-in then persists for ~2s) spanning `event_start-5s → event_end+5s`. No playback lock.
- Empty placeholder unchanged for Szenarien without a video.

**Event feed integration (`src/routes/index.tsx` / `event-feed.tsx`)**
- Player moves out of the modal dialog into the main dashboard as a new card above/beside the event feed, taking a Szenario's video.
- Clicking an event row calls the same seek+highlight handler on the mounted player (lift state or use a small ref/context). Row click no longer opens a modal for video — modal keeps text detail only, or is removed if redundant.
- `EventDetailDialog` remains reachable for description/confidence/cluster metadata but drops its embedded player.

---

## 3) Ereignisse tab → cross-line analytics

**New route `src/routes/ereignisse.tsx`** (nav item already exists, currently inert)
- Iterate all Linien + all Szenarien from the store.
- **Fehleranfälligkeits-Ranking table**: columns Linie, Prozessschritt (derive step from event category → step mapping: Fehlgriff→Pick, Farbverwechslung→Kontrolle, Taktzeitueberschreitung→Place, Zoegern→Pick, Prozessunterbrechung→Korrektur), Fehlerquote %, dominierende Kategorie. Sort desc.
- **Linienübergreifende Muster** — 2–4 auto-generated insight cards from simple stats:
  - Category X appears above line-average in ≥N lines → "'{Kategorie}' tritt in {n} von {total} Linien überdurchschnittlich häufig auf …".
  - Highest single-line Fehlerquote outlier.
  - Category concentrated in one cluster_source across lines.
  - Time-of-day/step correlation if extractable, else omit.
  - Templates are German, concrete, mention plausible root cause + suggested lever.

---

## 4) Automatisierungen tab

**New nav item + route `src/routes/automatisierungen.tsx`** (robot icon from lucide `Bot`)

**Current-state schematic**
- Horizontal flow: Pick → Place → Kontrolle → Korrektur (boxes + `ArrowRight`).
- Per box: average time (derive by splitting the Szenario's avg cycle time by category weight of events attributable to that step; fallback to fixed ratios if too sparse) and automation badge:
  - Count `timwoods_skills` events per step. Ratio > 0.15 → grey "nicht automatisierbar"; 0.05–0.15 → amber "bedingt"; < 0.05 → green "gut automatisierbar".

**"Digitalen Zwilling simulieren" button**
- Reuses pipeline visual pattern: 3 stages, ~2s each — "Prozessschritte werden in Simulationsmodell übersetzt…", "Automatisierungsszenario wird durchgerechnet…", "Wirtschaftlichkeit wird bewertet…".
- Result: two cards Aktuell / Mit Automatisierung showing Taktzeit, Durchsatz/h, Arbeitszeit/Woche. Improvement derived from current avgCycle × plausible factor (e.g. −25–40 %) seeded by szenarioId so it's stable per Szenario.
- Highlighted summary tile: "Geschätzte Einsparung: X,X Std./Woche (−YY %)".
- Persistent muted disclaimer: "Vereinfachte Simulation zu Demonstrationszwecken, ersetzt keine reale Digital-Twin-Validierung (z. B. NVIDIA Isaac Sim)." — verbatim, always visible.

---

## 5) Einstellungen: theme + language

**New route `src/routes/einstellungen.tsx`** (nav item exists)
- Hell/Dunkel toggle — toggles `dark` class on `<html>`; verify `src/styles.css` has dark variants (add minimal dark palette if missing, staying on-brand).
- Sprache toggle DE/EN.

**i18n plumbing (`src/lib/i18n.ts`)**
- Lightweight context + `useT()` hook, no external lib. Two flat dictionaries covering nav items, page headers, section titles, button labels, badge labels, KPI tile titles.
- AI-generated insight text and mock data stay German (explicit scope).

**Persistence**
- Both prefs saved to `localStorage` under `symplify:theme` / `symplify:lang`.
- Read inside `useEffect` (never in `useState` initializer) to avoid SSR/hydration mismatch — apply theme class in the same effect.

---

## Technical notes

- All state stays client-side in the existing `runs-store` external store; extend with new keys, no backend.
- New routes plug into TanStack file-based routing: `src/routes/linien.$lineId.tsx`, `src/routes/ereignisse.tsx`, `src/routes/automatisierungen.tsx`, `src/routes/einstellungen.tsx`. Each defines its own `head()` metadata.
- Sidebar (`src/components/blickwerk/sidebar.tsx`) gets the new Automatisierungen entry; existing Ereignisse/Einstellungen entries become active links.
- Video object URLs continue to be revoked on replacement; ownership tracked by `szenarioId`.
- Category → Prozessschritt mapping lives in `mock-data.ts` alongside `CATEGORY_LABELS` so ranking table and automation schematic share one source of truth.

## Out of scope (as requested)
Real Isaac Sim / physics backend, multi-user, edit/delete of Linien or Szenarien, translating AI-generated insight text to EN.
