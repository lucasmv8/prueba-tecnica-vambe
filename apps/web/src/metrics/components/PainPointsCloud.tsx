"use client";

import { Brain, ChevronDown, X, Users, AlertCircle, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFetchWithLoading } from "@/hooks/useFetchWithLoading";
import type { PainPointEntry, Client } from "@vambe/domain";
import { capitalizeFirst } from "@vambe/ui-system";
import { ClientListRow } from "@/shared/components/ClientListRow";
import { ModalContainer } from "@/shared/components/ModalContainer";
import { ToggleGroup } from "@/shared/components/ToggleGroup";

interface PainPointsCloudProps {
  painPoints: PainPointEntry[];
}

function closeRateColor(rate: number) {
  if (rate >= 60) return { text: "#4ADE80", bg: "#4ADE8015", border: "#4ADE8030" };
  if (rate >= 35) return { text: "#D97706", bg: "#D9770615", border: "#D9770630" };
  return { text: "#F87171", bg: "#F8717115", border: "#F8717130" };
}

function PainPointModal({
  painPoint,
  count,
  closeRate,
  onClose,
}: {
  painPoint: string;
  count: number;
  closeRate: number;
  onClose: () => void;
}) {
  useBodyScrollLock();
  const fetcher = useCallback(async () => {
    const params = new URLSearchParams({ painPoint, pageSize: "50" });
    const res = await fetch(`/api/clients?${params}`);
    const data = await res.json();
    return (data.clients ?? []) as Client[];
  }, [painPoint]);
  const { data: clients, loading, error } = useFetchWithLoading(fetcher);

  const rateColors = closeRateColor(closeRate);

  return (
    <ModalContainer onClose={onClose}>
        <div className="flex items-start gap-3 px-5 py-4 border-b border-border">
          <div className="mt-0.5 p-1.5 rounded-lg bg-[#A855F7]/10">
            <AlertCircle size={14} className="text-[#A855F7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {capitalizeFirst(painPoint)}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={11} />
                <span><strong className="text-foreground">{count}</strong> cliente{count !== 1 ? "s" : ""}</span>
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ color: rateColors.text, backgroundColor: rateColors.bg, borderColor: rateColors.border }}
              >
                {closeRate}% tasa de cierre
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#606060] hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Cargando clientes...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-12 text-red-400 text-sm">{error}</div>
          )}
          {clients && clients.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              No se encontraron clientes
            </div>
          )}
          {clients && clients.length > 0 && (
            <div>
              {clients.map((c) => (
                <ClientListRow
                  key={c.id}
                  client={c}
                  infoText={c.analysis?.conclusionEjecutiva}
                />
              ))}
            </div>
          )}
        </div>

        {clients && clients.length > 0 && (
          <div className="px-5 py-3 border-t border-border">
            <p className="text-xs text-[#505050]">
              Potencial: <span style={{ color: "#10B981" }}>•</span> alto &nbsp;
              <span style={{ color: "#F59E0B" }}>•</span> medio &nbsp;
              <span style={{ color: "#EF4444" }}>•</span> bajo
            </p>
          </div>
        )}
    </ModalContainer>
  );
}

type ViewMode = "frecuencia" | "conversion";

export function PainPointsCloud({ painPoints }: PainPointsCloudProps) {
  const [open, setOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("frecuencia");
  const [selected, setSelected] = useState<{ text: string; count: number; closeRate: number } | null>(null);

  if (painPoints.length === 0) return null;

  const seen = new Set<string>();
  const uniquePainPoints = painPoints.filter((p) => {
    if (seen.has(p.text)) return false;
    seen.add(p.text);
    return true;
  });

  const sortedPainPoints = [...uniquePainPoints].sort((a, b) =>
    viewMode === "conversion" ? b.closeRate - a.closeRate : b.count - a.count
  );

  const maxCount = Math.max(...uniquePainPoints.map((p) => p.count));

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="w-full px-5 py-3 flex items-center gap-2.5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity text-left cursor-pointer"
          >
            <Brain size={14} className="text-[#A855F7] shrink-0" />
            <span className="text-sm font-medium text-foreground">Pain Points detectados</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground truncate">
              {uniquePainPoints.length} categoría{uniquePainPoints.length !== 1 ? "s" : ""}
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <ToggleGroup
              options={[
                { value: "frecuencia" as ViewMode, label: "Frecuencia" },
                { value: "conversion" as ViewMode, label: "Conversión" },
              ]}
              value={viewMode}
              onChange={setViewMode}
              activeColor="#A855F7"
            />

            <span className="text-xs text-[#A855F7] bg-[#A855F718] border border-[#A855F730] rounded-full px-2 py-0.5">
              Extraído por IA
            </span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="cursor-pointer"
            >
              <ChevronDown
                size={14}
                className="text-muted-foreground transition-transform duration-200"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border">
            <div className="grid grid-cols-[1fr_44px_56px_64px] gap-3 px-4 py-1.5 border-b border-border">
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider">Problema</span>
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider text-right">Casos</span>
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider text-right">Cierre</span>
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider">
                {viewMode === "conversion" ? "Conv." : "Frec."}
              </span>
            </div>

            {sortedPainPoints.map(({ text, count, closeRate }) => {
              const rateColors = closeRateColor(closeRate);
              const barWidth = viewMode === "conversion"
                ? closeRate
                : (maxCount > 0 ? (count / maxCount) * 100 : 0);
              const barColor = viewMode === "conversion" ? rateColors.text : "#A855F7";

              return (
                <button
                  key={text}
                  onClick={() => setSelected({ text, count, closeRate })}
                  className="w-full grid grid-cols-[1fr_44px_56px_64px] gap-3 items-center px-4 py-2 border-b border-border last:border-0 hover:bg-muted transition-colors text-left group cursor-pointer"
                >
                  <span className="text-xs text-foreground group-hover:text-[#A855F7] transition-colors truncate">
                    {capitalizeFirst(text)}
                  </span>

                  <span className="text-xs font-semibold text-foreground text-right">{count}</span>

                  <div className="shrink-0 flex justify-end">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                      style={{ color: rateColors.text, backgroundColor: rateColors.bg, borderColor: rateColors.border }}
                    >
                      {closeRate}%
                    </span>
                  </div>

                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <PainPointModal
          painPoint={selected.text}
          count={selected.count}
          closeRate={selected.closeRate}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
