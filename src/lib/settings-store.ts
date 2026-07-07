import { useSyncExternalStore, useEffect } from "react";

export type Theme = "light" | "dark";
export type Lang = "de" | "en";

const THEME_KEY = "symplify:theme";
const LANG_KEY = "symplify:lang";

interface Settings {
  theme: Theme;
  lang: Lang;
  hydrated: boolean;
}

let state: Settings = { theme: "light", lang: "de", hydrated: false };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function setTheme(theme: Theme) {
  state = { ...state, theme };
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* noop */ }
  }
  applyTheme(theme);
  emit();
}

export function setLang(lang: Lang) {
  state = { ...state, lang };
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* noop */ }
  }
  emit();
}

const serverSnap: Settings = { theme: "light", lang: "de", hydrated: false };

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => state, () => serverSnap);
}

/** Call once at the app root to load persisted prefs. */
export function useHydrateSettings() {
  useEffect(() => {
    if (state.hydrated) return;
    let theme: Theme = "light";
    let lang: Lang = "de";
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") theme = t;
      const l = localStorage.getItem(LANG_KEY);
      if (l === "de" || l === "en") lang = l;
    } catch { /* noop */ }
    state = { theme, lang, hydrated: true };
    applyTheme(theme);
    emit();
  }, []);
}
