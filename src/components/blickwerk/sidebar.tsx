import { LayoutDashboard, Factory, Activity, Settings, HelpCircle } from "lucide-react";
import logoUrl from "@/assets/symplify-logo.svg";
import type { Line } from "@/lib/mock-data";

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, active: true },
  { label: "Linien", icon: Factory, active: false },
  { label: "Ereignisse", icon: Activity, active: false },
  { label: "Einstellungen", icon: Settings, active: false },
];

export function BlickWerkSidebar({ activeLine }: { activeLine: Line }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="symplify"
            className="h-9 w-9 rounded-md bg-white p-1 shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold tracking-tight text-base">symplify</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              Prozess-Intelligenz
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="rounded-md bg-sidebar-accent/50 p-3">
          <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60 mb-1">
            Aktive Linie
          </div>
          <div className="text-sm font-medium">{activeLine.name}</div>
          <div className="text-xs text-sidebar-foreground/60 mt-0.5">
            {activeLine.location} · {activeLine.camera_id}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] text-sidebar-foreground/70">Live-Analyse aktiv</span>
          </div>
        </div>
        <button className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          Hilfe & Support
        </button>
      </div>
    </aside>
  );
}
