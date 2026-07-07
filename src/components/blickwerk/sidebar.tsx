import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Factory,
  Activity,
  Settings,
  HelpCircle,
  Upload,
  Bot,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import logoUrl from "@/assets/symplify-logo.svg";
import type { Line } from "@/lib/mock-data";
import { useT } from "@/lib/i18n";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BlickWerkSidebar({ activeLine }: { activeLine: Line }) {
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { label: t("nav.neueAnalyse"), icon: Upload, to: "/neue-analyse" as const },
    { label: t("nav.uebersicht"), icon: LayoutDashboard, to: "/" as const },
    { label: t("nav.linien"), icon: Factory, to: "/linien" as const },
    { label: t("nav.ereignisse"), icon: Activity, to: "/ereignisse" as const },
    { label: t("nav.automatisierungen"), icon: Bot, to: "/automatisierungen" as const },
    { label: t("nav.einstellungen"), icon: Settings, to: "/einstellungen" as const },
  ];

  const width = collapsed ? "w-16" : "w-64";

  const CollapseToggle = (
    <button
      onClick={() => setCollapsed((v) => !v)}
      className={`flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors ${
        collapsed ? "h-8 w-8" : "h-7 w-7"
      }`}
      aria-label={collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen"}
    >
      {collapsed ? (
        <ChevronsRight className="h-4 w-4" />
      ) : (
        <ChevronsLeft className="h-3.5 w-3.5" />
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={`hidden md:flex shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out ${width}`}
      >
        <div
          className={`border-b border-sidebar-border ${
            collapsed ? "px-2 py-4 flex justify-center" : "px-4 py-4"
          }`}
        >
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{CollapseToggle}</TooltipTrigger>
              <TooltipContent side="right">Seitenleiste ausklappen</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="symplify"
                className="h-9 w-9 rounded-md bg-white p-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold tracking-tight text-base leading-tight">
                  symplify
                </div>
                <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
                  Prozess-Intelligenz
                </div>
              </div>
              {CollapseToggle}
            </div>
          )}
        </div>

        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const base = `w-full flex items-center rounded-md text-sm transition-colors ${
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
            } ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`;

            const inner = (
              <>
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </>
            );

            const el = (
              <Link to={item.to} className={base}>
                {inner}
              </Link>
            );

            if (!collapsed) return <div key={item.label}>{el}</div>;
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>{el}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div
          className={`border-t border-sidebar-border ${
            collapsed ? "px-2 py-3" : "px-3 py-4"
          }`}
        >
          {!collapsed && (
            <div className="rounded-md bg-sidebar-accent/50 p-3 mb-3">
              <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60 mb-1">
                {t("sidebar.activeLine")}
              </div>
              <div className="text-sm font-medium">{activeLine.name}</div>
              <div className="text-xs text-sidebar-foreground/60 mt-0.5">
                {activeLine.location} · {activeLine.camera_id}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] text-sidebar-foreground/70">
                  {t("sidebar.liveActive")}
                </span>
              </div>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-full flex items-center justify-center px-2 py-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  aria-label={t("sidebar.help")}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("sidebar.help")}</TooltipContent>
            </Tooltip>
          ) : (
            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
              {t("sidebar.help")}
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
