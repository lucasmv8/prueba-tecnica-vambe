"use client";

import { useState, useEffect } from "react";
import { Zap, TrendingUp, Award, Building2, X, Users, Loader2, ExternalLink } from "lucide-react";
import type { KPIData, Client } from "@vambe/domain";
import { capitalizeFirst } from "@vambe/ui-system";

interface KPICardsProps {
  kpis: KPIData;
}

const URGENCIA_DOT: Record<string, string> = {
  alta:  "#F87171",
  media: "#FACC15",
  baja:  "#4ADE80",
};

const ETAPA_LABEL: Record<string, string> = {
  explorando:         "Explorando",
  evaluando:          "Evaluando",
  listo_para_comprar: "Listo para comprar",
};

// ─── Modal de Leads Calificados ────────────────────────────────────────────────

function LeadsModal({ onClose }: { onClose: () => void }) {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/clients?calificado=true&pageSize=100");
        const data = await res.json();
        setClients(data.clients ?? []);
      } catch {
        setError("No se pudieron cargar los clientes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-[#2A2A2A]">
          <div className="mt-0.5 p-1.5 rounded-lg bg-[#A855F7]/10">
            <Zap size={14} className="text-[#A855F7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Leads Calificados</p>
            <p className="text-xs text-[#606060] mt-1 leading-relaxed">
              Prospectos abiertos con urgencia alta, o en etapa evaluando / listo para comprar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#606060] hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-[#606060]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-12 text-red-400 text-sm">{error}</div>
          )}
          {clients && clients.length === 0 && (
            <div className="flex items-center justify-center py-12 text-[#606060] text-sm">
              No hay leads calificados
            </div>
          )}
          {clients && clients.length > 0 && (
            <div>
              {clients.map((c) => {
                const urgColor = URGENCIA_DOT[c.urgencia ?? ""] ?? "#606060";
                const etapaLabel = ETAPA_LABEL[c.etapaDecision ?? ""] ?? c.etapaDecision ?? "—";
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-1.5 px-4 py-3 border-b border-[#1E1E1E] last:border-0 hover:bg-[#1A1A1A] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: urgColor }}
                            title={`Urgencia: ${c.urgencia ?? "—"}`}
                          />
                          <span className="text-sm font-medium text-white truncate">{c.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4 mt-0.5">
                          <span className="text-xs text-[#606060]">{c.vendedor}</span>
                          <span className="text-[10px] text-[#505050]">·</span>
                          <span className="text-xs text-[#505050]">{etapaLabel}</span>
                        </div>
                      </div>
                      {c.leadScore !== null && (
                        <span className="text-xs font-medium text-[#A855F7] shrink-0" title="Lead Score">
                          {c.leadScore}pts
                        </span>
                      )}
                    </div>
                    {c.painPoint && (
                      <p className="text-xs text-[#808080] ml-4 truncate" title={c.painPoint}>
                        {capitalizeFirst(c.painPoint)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {clients && clients.length > 0 && (
          <div className="px-5 py-3 border-t border-[#1E1E1E] flex items-center justify-between">
            <p className="text-xs text-[#505050]">
              <span style={{ color: "#F87171" }}>•</span> urgencia alta &nbsp;
              <span style={{ color: "#FACC15" }}>•</span> media &nbsp;
              <span style={{ color: "#4ADE80" }}>•</span> baja
            </p>
            <span className="text-xs text-[#505050]">
              {clients.length} cliente{clients.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI Cards ─────────────────────────────────────────────────────────────────

export function KPICards({ kpis }: KPICardsProps) {
  const [showLeadsModal, setShowLeadsModal] = useState(false);

  const cards = [
    {
      id: "leads",
      label: "Leads Calificados",
      value: String(kpis.leadsCalificados),
      suffix: "",
      subtitle: `de ${kpis.totalClients - (kpis.pendingAnalysis > 0 ? kpis.pendingAnalysis : 0)} analizados`,
      description: "Abiertos con urgencia alta o en etapa evaluando / listo para comprar",
      subtitleColor: "#A0A0A0" as const,
      icon: Zap,
      highlight: kpis.leadsCalificados > 0,
      onClick: () => setShowLeadsModal(true),
    },
    {
      id: "cierre",
      label: "Tasa de Cierre",
      value: String(kpis.closeRate),
      suffix: "%",
      subtitle: `${Math.round(kpis.totalClients * kpis.closeRate / 100)} de ${kpis.totalClients} reuniones`,
      description: null,
      subtitleColor: "#A0A0A0" as const,
      icon: TrendingUp,
      highlight: false,
      onClick: undefined,
    },
    {
      id: "vendedor",
      label: "Vendedor Top",
      value: capitalizeFirst(kpis.topVendedor),
      suffix: "",
      subtitle: kpis.topVendedor !== "-" ? `${kpis.topVendedorCloseRate}% tasa de cierre` : "—",
      description: null,
      subtitleColor: kpis.topVendedorCloseRate >= 60 ? "#4ADE80" : kpis.topVendedorCloseRate >= 40 ? "#FACC15" : "#A0A0A0" as const,
      icon: Award,
      highlight: false,
      onClick: undefined,
    },
    {
      id: "industria",
      label: "Industria Líder",
      value: capitalizeFirst(kpis.topIndustria),
      suffix: "",
      subtitle: kpis.topIndustria !== "-" ? `${kpis.topIndustriaCloseRate}% tasa de cierre` : "—",
      description: null,
      subtitleColor: kpis.topIndustriaCloseRate >= 60 ? "#4ADE80" : kpis.topIndustriaCloseRate >= 40 ? "#FACC15" : "#A0A0A0" as const,
      icon: Building2,
      highlight: false,
      onClick: undefined,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ id, label, value, suffix, subtitle, description, subtitleColor, icon: Icon, highlight, onClick }) => (
          <div
            key={id}
            onClick={onClick}
            className={`bg-[#161616] border rounded-xl p-5 flex flex-col gap-3 transition-colors ${
              highlight ? "border-[#A855F7]/40 hover:border-[#A855F7]/60" : "border-[#2A2A2A] hover:border-[#3A3A3A]"
            } ${onClick ? "cursor-pointer" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#A0A0A0] text-xs font-medium uppercase tracking-wider">
                {label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  highlight ? "bg-[#A855F7]/10" : "bg-[#2563EB]/10"
                }`}
              >
                <Icon
                  size={15}
                  className={highlight ? "text-[#A855F7]" : "text-[#2563EB]"}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {value}
                {suffix && (
                  <span className="text-lg font-normal text-[#A0A0A0] ml-0.5">
                    {suffix}
                  </span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: subtitleColor }}>
                {subtitle}
              </div>
            </div>
            {description && (
              <p className="text-[10px] text-[#505050] leading-relaxed border-t border-[#1E1E1E] pt-2.5">
                {description}
              </p>
            )}
            {onClick && (
              <div className="flex items-center gap-1 text-[10px] text-[#A855F7]/70 -mt-1">
                <Users size={10} />
                <span>Ver lista</span>
                <ExternalLink size={9} />
              </div>
            )}
          </div>
        ))}
      </div>

      {showLeadsModal && <LeadsModal onClose={() => setShowLeadsModal(false)} />}
    </>
  );
}
