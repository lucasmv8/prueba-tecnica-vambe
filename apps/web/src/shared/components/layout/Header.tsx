"use client";

import { RefreshCw, AlertCircle, Square, CheckCircle2, Play, Sparkles, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { AnalysisProgress } from "@vambe/domain";

type Page = "resumen" | "analisis" | "clientes";

interface HeaderProps {
  pendingCount: number;
  totalClients: number;
  progress: AnalysisProgress;
  onAnalyzePending: () => void;
  onReanalyzeAll: () => void;
  onStop: () => void;
  activePage: Page;
  onPageChange: (page: Page) => void;
}

const TABS: { id: Page; label: string }[] = [
  { id: "resumen",  label: "Resumen"  },
  { id: "analisis", label: "Análisis" },
  { id: "clientes", label: "Clientes" },
];

export function Header({
  pendingCount,
  totalClients,
  progress,
  onAnalyzePending,
  onReanalyzeAll,
  onStop,
  activePage,
  onPageChange,
}: HeaderProps) {
  const isAnalyzing = progress.status === "running";
  const isCompleted = progress.status === "completed";
  const { theme, setTheme } = useTheme();

  const percent =
    progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  return (
    <header className="sticky top-4 z-50 px-6 pointer-events-none">
      <nav
        className="relative pointer-events-auto max-w-[900px] mx-auto flex items-center justify-between px-5
          bg-background/75 backdrop-blur-xl
          border border-border
          rounded-full overflow-hidden
          shadow-[0_8px_40px_rgba(0,0,0,0.15)]
          transition-all duration-300"
        style={{ height: isAnalyzing ? "64px" : "56px" }}
      >
        {/* Progress bar — bottom of pill */}
        {isAnalyzing && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground/5">
            <div
              className="h-full bg-[#2563EB] transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {/* Top row — always visible */}
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className="shrink-0 text-foreground">
              <path
                d="M11 1L21 11L11 21L1 11L11 1Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-0">
                <span className="font-semibold text-foreground text-[14px] tracking-tight">
                  vambe
                </span>
                <span className="mx-2 select-none text-border">·</span>
                <span className="text-muted-foreground text-xs font-medium hidden sm:block">
                  Sales Intelligence
                </span>
              </div>
              {isAnalyzing && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                  {progress.currentName
                    ? `Analizando — ${progress.currentName}`
                    : "Preparando análisis…"}
                </span>
              )}
            </div>
          </div>

          {/* Tabs — hidden while analyzing on small screens */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = activePage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onPageChange(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground/80 hover:bg-foreground/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Completed flash */}
            {isCompleted && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium animate-pulse">
                <CheckCircle2 size={12} />
                <span className="hidden sm:block">Completado</span>
              </div>
            )}

            {/* Pending badge — only when idle and there are pending */}
            {pendingCount > 0 && !isAnalyzing && !isCompleted && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
                <AlertCircle size={12} />
                <span className="hidden sm:block">{pendingCount} sin analizar</span>
              </div>
            )}

            {/* Analyzing: counter + stop */}
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                  {progress.processed}
                  <span className="opacity-50">/{progress.total}</span>
                  <span className="opacity-50 ml-1">({percent}%)</span>
                </span>
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                    text-red-400 border border-red-900/60 hover:bg-red-950/50
                    transition-colors cursor-pointer"
                >
                  <Square size={9} fill="currentColor" />
                  <span className="hidden sm:block">Detener</span>
                </button>
              </div>
            ) : pendingCount === totalClients && totalClients > 0 ? (
              <button
                onClick={onAnalyzePending}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium
                  bg-[#2563EB] text-white hover:bg-[#1D4ED8]
                  cursor-pointer transition-colors"
              >
                <Play size={11} fill="currentColor" />
                <span className="hidden sm:block">Comenzar análisis</span>
              </button>
            ) : pendingCount > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onAnalyzePending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium
                    bg-[#2563EB] text-white hover:bg-[#1D4ED8]
                    cursor-pointer transition-colors"
                >
                  <Sparkles size={11} />
                  <span className="hidden sm:block">Analizar pendientes</span>
                </button>
                <button
                  onClick={onReanalyzeAll}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium
                    bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-border/80
                    cursor-pointer transition-colors"
                >
                  <RefreshCw size={11} />
                  <span className="hidden sm:block">Analizar todos</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onReanalyzeAll}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium
                  bg-secondary text-muted-foreground border border-border hover:text-foreground hover:border-border/80
                  cursor-pointer transition-colors"
              >
                <RefreshCw size={11} />
                <span className="hidden sm:block">Analizar todos</span>
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5
                transition-colors cursor-pointer"
              aria-label="Cambiar tema"
            >
              <Sun size={14} className="hidden dark:block" />
              <Moon size={14} className="block dark:hidden" />
            </button>
          </div>
        </div>

      </nav>
    </header>
  );
}
