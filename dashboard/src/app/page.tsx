"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/shared/components/layout/Header";
import { KPICards } from "@/features/metrics/components/KPICards";
import { ChartsSection } from "@/features/metrics/components/ChartsSection";
import { DataQualityCard } from "@/features/metrics/components/DataQualityCard";
import { ClientsTable } from "@/features/clients/components/ClientsTable";
import type { MetricsData } from "@/features/metrics/types";
import type { ClientsResponse } from "@/features/clients/types";
import type { AnalysisProgress } from "@/features/analysis/types";
import { DEFAULT_FILTERS, type FilterState } from "@/features/filters/types";

const EMPTY_METRICS: MetricsData = {
  kpis: { totalClients: 0, closeRate: 0, topVendedor: "-", topVendedorCloseRate: 0, topIndustria: "-", topIndustriaCloseRate: 0, leadsCalificados: 0, pendingAnalysis: 0 },
  byIndustria: [],
  byVendedor: [],
  byMonth: [],
  byEtapaDecision: [],
  duplicateEmails: [],
  topPainPoints: [],
};

const EMPTY_CLIENTS: ClientsResponse = {
  clients: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
};

type Page = "resumen" | "analisis" | "clientes";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData>(EMPTY_METRICS);
  const [clients, setClients] = useState<ClientsResponse>(EMPTY_CLIENTS);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activePage, setActivePage] = useState<Page>("resumen");
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: "idle",
    processed: 0,
    total: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const analysisRunning = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMetrics = useCallback(async () => {
    const res = await fetch("/api/metrics");
    const data = await res.json();
    setMetrics(data);
    return data as MetricsData;
  }, []);

  const fetchClients = useCallback(async (f: FilterState) => {
    setLoadingClients(true);
    const params = new URLSearchParams();
    if (f.vendedor) params.set("vendedor", f.vendedor);
    if (f.industria) params.set("industria", f.industria);
    if (f.closed) params.set("closed", f.closed);
    if (f.urgencia) params.set("urgencia", f.urgencia);
    if (f.etapaDecision) params.set("etapaDecision", f.etapaDecision);
    if (f.q) params.set("q", f.q);
    params.set("page", String(f.page));
    const res = await fetch(`/api/clients?${params}`);
    const data = await res.json();
    setClients(data);
    setLoadingClients(false);
  }, []);

  const startAnalysis = useCallback(
    async (force: boolean) => {
      if (analysisRunning.current) return;
      analysisRunning.current = true;

      const abort = new AbortController();
      abortControllerRef.current = abort;

      setProgress({ status: "running", processed: 0, total: 0 });

      try {
        const res = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force }),
          signal: abort.signal,
        });

        const reader = res.body!.getReader();

        // Cancelar el reader cuando se aborte
        abort.signal.addEventListener("abort", () => reader.cancel());

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done || abort.signal.aborted) break;

          const text = decoder.decode(value);
          const lines = text.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.status === "completed") {
                setProgress((p) => ({ status: "completed", processed: p.total, total: p.total }));
                await fetchMetrics();
                setLoadingMetrics(false);
                await fetchClients(filters);
              } else if (data.status === "error") {
                setProgress({ status: "error", processed: 0, total: 0, error: data.error });
              } else {
                setProgress({
                  status: "running",
                  processed: data.processed,
                  total: data.total,
                  currentName: data.currentName,
                });
              }
            } catch {}
          }
        }
      } catch (e: unknown) {
        // AbortError es intencional — no mostrar como error
        if ((e as Error)?.name !== "AbortError") {
          setProgress({ status: "error", processed: 0, total: 0, error: String(e) });
        }
      } finally {
        analysisRunning.current = false;
        abortControllerRef.current = null;
        setProgress((p) =>
          p.status === "running"
            ? { ...p, status: "idle" }           // fue detenido manualmente
            : p
        );
        setTimeout(() => {
          setProgress((p) => (p.status === "completed" ? { ...p, status: "idle" } : p));
        }, 4000);
      }
    },
    [fetchMetrics, fetchClients, filters]
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoadingMetrics(true);
      const data = await fetchMetrics();
      setLoadingMetrics(false);
      await fetchClients(DEFAULT_FILTERS);

      // Auto-trigger analysis if there are pending clients
      if (data.kpis.pendingAnalysis > 0) {
        startAnalysis(false);
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch clients when filters change
  useEffect(() => {
    fetchClients(filters);
  }, [filters, fetchClients]);

  const handleReanalyzeOne = async (id: string) => {
    await fetch(`/api/analysis/${id}`, { method: "POST" });
    await Promise.all([fetchClients(filters), fetchMetrics()]);
  };

  const stopAnalysis = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      <Header
        pendingCount={metrics.kpis.pendingAnalysis}
        progress={progress}
        onReanalyzeAll={() => startAnalysis(true)}
        onStop={stopAnalysis}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 pt-8 pb-6 space-y-6">

        {/* ── Resumen ─────────────────────────────────────────────────────── */}
        {activePage === "resumen" && (
          <>
            {loadingMetrics ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5 h-24 animate-pulse" />
                ))}
              </div>
            ) : (
              <KPICards kpis={metrics.kpis} />
            )}

            {!loadingMetrics && (
              <DataQualityCard duplicateEmails={metrics.duplicateEmails} />
            )}

            {!loadingMetrics && metrics.byIndustria.some((d) => d.name !== "Sin categorizar") && (
              <ChartsSection data={metrics} view="resumen" />
            )}
          </>
        )}

        {/* ── Análisis ─────────────────────────────────────────────────────── */}
        {activePage === "analisis" && (
          <>
            {!loadingMetrics && metrics.byIndustria.some((d) => d.name !== "Sin categorizar") ? (
              <ChartsSection data={metrics} view="analisis" />
            ) : !loadingMetrics ? (
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-8 text-center">
                <p className="text-[#A0A0A0] text-sm">
                  Los gráficos aparecerán cuando se complete el análisis IA de los clientes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5 h-48 animate-pulse" />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Clientes ─────────────────────────────────────────────────────── */}
        {activePage === "clientes" && (
          <>
            {loadingClients ? (
              <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-8 animate-pulse h-48" />
            ) : (
              <ClientsTable
                data={clients}
                page={filters.page}
                filters={filters}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                onFiltersChange={setFilters}
                onReanalyze={handleReanalyzeOne}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}
