import { createFileRoute } from "@tanstack/react-router";
import { Sun, Moon, Languages } from "lucide-react";
import { BlickWerkSidebar } from "@/components/blickwerk/sidebar";
import { LINES } from "@/lib/mock-data";
import {
  useSettings,
  setTheme,
  setLang,
  type Theme,
  type Lang,
} from "@/lib/settings-store";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen – symplify" },
      { name: "description", content: "Design und Sprache anpassen." },
    ],
  }),
  component: EinstellungenPage,
});

function EinstellungenPage() {
  const t = useT();
  const { theme, lang } = useSettings();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <BlickWerkSidebar activeLine={LINES[0]} />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">
            {t("page.einstellungen.title")}
          </h1>
        </header>

        <div className="flex-1 p-6 space-y-6 max-w-2xl">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              {t("page.einstellungen.theme")}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t("page.einstellungen.themeHint")}
            </p>
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <ToggleBtn
                active={theme === "light"}
                onClick={() => setTheme("light" as Theme)}
                icon={<Sun className="h-3.5 w-3.5" />}
                label={t("theme.light")}
              />
              <ToggleBtn
                active={theme === "dark"}
                onClick={() => setTheme("dark" as Theme)}
                icon={<Moon className="h-3.5 w-3.5" />}
                label={t("theme.dark")}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              {t("page.einstellungen.language")}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t("page.einstellungen.languageHint")}
            </p>
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <ToggleBtn
                active={lang === "de"}
                onClick={() => setLang("de" as Lang)}
                icon={<Languages className="h-3.5 w-3.5" />}
                label="Deutsch"
              />
              <ToggleBtn
                active={lang === "en"}
                onClick={() => setLang("en" as Lang)}
                icon={<Languages className="h-3.5 w-3.5" />}
                label="English"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-background text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
