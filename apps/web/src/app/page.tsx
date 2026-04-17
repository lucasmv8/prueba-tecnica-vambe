"use client";

import { useState } from "react";
import { useMetrics } from "@/metrics/hooks/useMetrics";
import { useClients } from "@/clients/hooks/useClients";
import { useAnalysis } from "@/analysis/hooks/useAnalysis";
import { Header } from "@/shared/components/layout/Header";
import { KPICards } from "@/metrics/components/KPICards";
import { ChartsSection } from "@/metrics/components/ChartsSection";
import { DataQualityCard } from "@/metrics/components/DataQualityCard";
import { AlertsSection } from "@/metrics/components/AlertsSection";
import { ClientsTable } from "@/clients/components/ClientsTable";

type Page = "resumen" | "analisis" | "clientes";

export default function DashboardPage() {
  const [activePage, setActivePage] = useState<Page>("resumen");
  const { metrics, loading: loadingMetrics, fetchMetrics } = useMetrics();
  const { clients, loading: loadingClients, filters, setFilters, fetchClients, refetch } = useClients();
  const { progress, startAnalysis, stopAnalysis } = useAnalysis();

  const handleStartAnalysis = (force: boolean) =>
    startAnalysis(force, async () => {
      await fetchMetrics();
      await refetch();
    });

  const handleReanalyzeOne = async (id: string) => {
    await fetch(`/api/analysis/${id}`, { method: "POST" });
    await Promise.all([fetchMetrics(), refetch()]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D]">
      <Header
        pendingCount={metrics.kpis.pendingAnalysis}
        totalClients={metrics.kpis.totalClients}
        progress={progress}
        onAnalyzePending={() => handleStartAnalysis(false)}
        onReanalyzeAll={() => handleStartAnalysis(true)}
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

            {!loadingMetrics && metrics.alertas.length > 0 && (
              <AlertsSection alertas={metrics.alertas} />
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
            {loadingClients && clients.clients.length === 0 ? (
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
