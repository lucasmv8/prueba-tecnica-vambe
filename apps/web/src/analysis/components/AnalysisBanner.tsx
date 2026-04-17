"use client";

import { Loader2, CheckCircle2, Square } from "lucide-react";
import type { AnalysisProgress } from "@vambe/domain";

interface AnalysisBannerProps {
  progress: AnalysisProgress;
  onStop?: () => void;
}

export function AnalysisBanner({ progress, onStop }: AnalysisBannerProps) {
  if (progress.status === "idle") return null;

  const percent =
    progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  return (
    <div className="bg-card border-b border-border px-6 py-3">
      <div className="max-w-[1400px] mx-auto">
        {progress.status === "running" && (
          <div className="flex items-center gap-3">
            <Loader2 size={14} className="animate-spin text-[#2563EB] shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-foreground">
                  Analizando transcripciones con IA
                  {progress.currentName && (
                    <span className="text-foreground ml-1">— {progress.currentName}</span>
                  )}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {progress.processed}/{progress.total} ({percent}%)
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <button
              onClick={onStop}
              title="Detener análisis"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-red-400 border border-red-900 hover:bg-red-950 transition-colors shrink-0 cursor-pointer"
            >
              <Square size={10} fill="currentColor" />
              Detener
            </button>
          </div>
        )}

        {progress.status === "completed" && (
          <div className="flex items-center gap-2 text-green-400 text-xs">
            <CheckCircle2 size={14} />
            <span>Análisis completado — {progress.total} clientes procesados</span>
          </div>
        )}

        {progress.status === "error" && (
          <div className="text-red-400 text-xs">
            Error en el análisis: {progress.error}
          </div>
        )}
      </div>
    </div>
  );
}
