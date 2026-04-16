"use client";

import { RefreshCw, AlertCircle, Square, CheckCircle2, Play, Sparkles } from "lucide-react";
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

  const percent =
    progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  return (
    <header className="sticky top-4 z-50 px-6 pointer-events-none">
      <nav
        className="relative pointer-events-auto max-w-[900px] mx-auto flex items-center justify-between px-5
          bg-[#0D0D0D]/75 backdrop-blur-xl
          border border-white/[0.07]
          rounded-full overflow-hidden
          shadow-[0_8px_40px_rgba(0,0,0,0.75)]
          transition-all duration-300"
        style={{ height: isAnalyzing ? "64px" : "56px" }}
      >
        {/* Progress bar — bottom of pill */}
        {isAnalyzing && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.05]">
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
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" className="shrink-0">
              <path
                d="M11 1L21 11L11 21L1 11L11 1Z"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-0">
                <span className="font-semibold text-white text-[14px] tracking-tight">
                  vambe
                </span>
                <span className="text-[#303030] mx-2 select-none">·</span>
                <span className="text-[#606060] text-xs font-medium hidden sm:block">
                  Sales Intelligence
                </span>
              </div>
              {isAnalyzing && (
                <span className="text-[10px] text-[#505050] truncate max-w-[180px]">
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
                      ? "bg-white/10 text-white"
                      : "text-[#707070] hover:text-[#C0C0C0] hover:bg-white/5"
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
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                <AlertCircle size={12} />
                <span className="hidden sm:block">{pendingCount} sin analizar</span>
              </div>
            )}

            {/* Analyzing: counter + stop */}
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#606060] tabular-nums hidden sm:block">
                  {progress.processed}
                  <span className="text-[#404040]">/{progress.total}</span>
                  <span className="text-[#404040] ml-1">({percent}%)</span>
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
              /* None analyzed yet */
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
              /* Some pending, some already analyzed */
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
                    bg-[#1E1E1E] text-[#A0A0A0] border border-[#2A2A2A] hover:text-white hover:border-[#3A3A3A]
                    cursor-pointer transition-colors"
                >
                  <RefreshCw size={11} />
                  <span className="hidden sm:block">Analizar todos</span>
                </button>
              </div>
            ) : (
              /* All analyzed */
              <button
                onClick={onReanalyzeAll}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium
                  bg-[#1E1E1E] text-[#A0A0A0] border border-[#2A2A2A] hover:text-white hover:border-[#3A3A3A]
                  cursor-pointer transition-colors"
              >
                <RefreshCw size={11} />
                <span className="hidden sm:block">Analizar todos</span>
              </button>
            )}
          </div>
        </div>

      </nav>
    </header>
  );
}
