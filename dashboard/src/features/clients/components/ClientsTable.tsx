"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, X, Brain, Eye, Search, ChevronDown } from "lucide-react";
import type { Client, ClientsResponse } from "../types";
import type { FilterState } from "@/features/filters/types";
import { formatDate, capitalizeFirst, URGENCY_COLORS } from "@/shared/lib/utils";

interface ClientsTableProps {
  data: ClientsResponse;
  page: number;
  filters: FilterState;
  onPageChange: (page: number) => void;
  onFiltersChange: (f: FilterState) => void;
  onReanalyze: (id: string) => Promise<void>;
}

// ─── Filter bar internals ──────────────────────────────────────────────────

interface FilterDef {
  key: keyof Omit<FilterState, "q" | "page">;
  label: string;
  options: { value: string; label: string }[];
}

const FILTER_DEFS: FilterDef[] = [
  {
    key: "vendedor",
    label: "Vendedor",
    options: ["Toro", "Puma", "Zorro", "Boa", "Tiburón"].map((v) => ({ value: v, label: v })),
  },
  {
    key: "industria",
    label: "Industria",
    options: ["finanzas", "salud", "retail", "educacion", "logistica", "turismo", "tecnologia", "moda", "restaurante", "consultoria"].map(
      (v) => ({ value: v, label: capitalizeFirst(v) })
    ),
  },
  {
    key: "closed",
    label: "Estado",
    options: [
      { value: "true", label: "Cerrado" },
      { value: "false", label: "Abierto" },
    ],
  },
  {
    key: "urgencia",
    label: "Urgencia",
    options: ["alta", "media", "baja"].map((v) => ({ value: v, label: capitalizeFirst(v) })),
  },
  {
    key: "etapaDecision",
    label: "Etapa",
    options: [
      { value: "explorando", label: "Explorando" },
      { value: "evaluando", label: "Analizando" },
      { value: "listo_para_comprar", label: "Listo para comprar" },
    ],
  },
];

function FilterPill({
  def,
  value,
  onChange,
}: {
  def: FilterDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "";
  const activeLabel = def.options.find((o) => o.value === value)?.label ?? def.label;

  return (
    <div className="relative">
      <button
        onClick={() => (active ? onChange("") : setOpen((o) => !o))}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
          active
            ? "bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/40"
            : "bg-[#1E1E1E] text-[#A0A0A0] border-[#2A2A2A] hover:text-white hover:border-[#3A3A3A]"
        }`}
      >
        {activeLabel}
        {active ? <X size={10} /> : <ChevronDown size={10} />}
      </button>

      {open && !active && (
        <div className="absolute top-full left-0 mt-1 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl shadow-xl z-20 min-w-[140px] py-1 overflow-hidden">
          {def.options.map((opt) => (
            <button
              key={opt.value}
              onMouseDown={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────

function Tag({ value, colorMap }: { value: string | null; colorMap?: Record<string, string> }) {
  if (!value) return <span className="text-[#A0A0A0] text-xs">—</span>;
  const color = colorMap?.[value] ?? "#A0A0A0";
  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}
    >
      {capitalizeFirst(value)}
    </span>
  );
}

// ─── Client Detail Modal ───────────────────────────────────────────────────

function ClientDetailModal({
  client,
  onClose,
  onReanalyze,
}: {
  client: Client;
  onClose: () => void;
  onReanalyze: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleReanalyze = async () => {
    setLoading(true);
    try { await onReanalyze(client.id); } finally { setLoading(false); }
  };

  const metaFields = [
    { label: "Industria",    value: client.industria },
    { label: "Tamaño",       value: client.tamanioEmpresa },
    { label: "Volumen",      value: client.volumenMensajes },
    { label: "Canal",        value: client.canalDescubrimiento },
    { label: "Objeciones",   value: client.objeciones },
    { label: "Etapa",        value: client.etapaDecision },
  ];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="fixed inset-0 bg-black/60 z-40 cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="Cerrar panel"
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-[#161616] border-l border-[#2A2A2A] z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base font-semibold text-white truncate">{client.nombre}</span>
              {client.hasDuplicateEmail && (
                <span title="Email compartido"><AlertTriangle size={12} className="text-amber-400 shrink-0" /></span>
              )}
            </div>
            <div className="text-xs text-[#A0A0A0]">{client.correo}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                client.closed
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {client.closed ? "Cerrado" : "Abierto"}
              </span>
              {client.urgencia && <Tag value={client.urgencia} colorMap={URGENCY_COLORS} />}
              {client.leadScore !== null && (
                <span className="text-xs font-semibold" style={{
                  color: client.leadScore >= 70 ? "#10B981" : client.leadScore >= 40 ? "#F59E0B" : "#EF4444"
                }}>
                  Score {client.leadScore}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleReanalyze}
              disabled={loading}
              title="Re-analizar con IA"
              className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Transcripción */}
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4">
            <h4 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">Transcripción</h4>
            <p className="text-xs text-[#C0C0C0] leading-relaxed">{client.transcripcion}</p>
          </div>

          {/* Análisis IA */}
          {client.analyzedAt ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={12} className="text-[#A855F7]" />
                <h4 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">Análisis IA</h4>
              </div>
              {client.resumenLLM && (
                <p className="text-xs text-white bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg px-3 py-2 leading-relaxed">
                  {client.resumenLLM}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {metaFields.map(({ label, value }) => (
                  <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
                    <div className="text-[10px] text-[#505050] uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-xs text-white">
                      {value ? capitalizeFirst(value) : <span className="text-[#A0A0A0]">—</span>}
                    </div>
                  </div>
                ))}
              </div>
              {client.painPoint && (
                <div className="bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-[#A855F7] uppercase tracking-wider mb-1">Pain Point</div>
                  <p className="text-xs text-[#C0C0C0]">{client.painPoint}</p>
                </div>
              )}
              {client.integraciones && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
                  <div className="text-[10px] text-[#505050] uppercase tracking-wider mb-0.5">Integraciones</div>
                  <div className="text-xs text-white">{capitalizeFirst(client.integraciones)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#A0A0A0]">Pendiente de análisis</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function ClientsTable({ data, page, filters, onPageChange, onFiltersChange, onReanalyze }: ClientsTableProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);

  const setFilter = (key: keyof FilterState, value: string) =>
    onFiltersChange({ ...filters, [key]: value, page: 1 });

  const handleReanalyze = async (id: string) => {
    setReanalyzingId(id);
    try { await onReanalyze(id); } finally { setReanalyzingId(null); }
  };

  return (
    <>
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onReanalyze={handleReanalyze}
        />
      )}

      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl">
        {/* Search + Filters bar */}
        <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#505050]" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-full pl-8 pr-4 py-1.5 text-xs text-white placeholder:text-[#505050] focus:outline-none focus:border-[#2563EB]/60 transition-colors"
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_DEFS.map((def) => (
              <FilterPill
                key={def.key}
                def={def}
                value={filters[def.key] ?? ""}
                onChange={(v) => setFilter(def.key, v)}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                {["Cliente", "Industria", "Vendedor", "Fecha", "Estado", "Urgencia", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-medium text-[#505050] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.clients ?? []).map((client) => (
                <tr key={client.id} className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white">{client.nombre}</span>
                        {client.hasDuplicateEmail && (
                          <span title="Email compartido"><AlertTriangle size={11} className="text-amber-400 shrink-0" /></span>
                        )}
                      </div>
                      <div className="text-xs text-[#A0A0A0]">{client.correo}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Tag value={client.industria} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[#A0A0A0]">{client.vendedor}</td>
                  <td className="px-4 py-3 text-xs text-[#A0A0A0] whitespace-nowrap">{formatDate(client.fechaReunion)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.closed
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {client.closed ? "Cerrado" : "Abierto"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Tag value={client.urgencia} colorMap={URGENCY_COLORS} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {/* Ver */}
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#2563EB]/10 text-[#60A5FA] border border-[#2563EB]/25 hover:bg-[#2563EB]/20 hover:border-[#2563EB]/50 transition-colors cursor-pointer"
                      >
                        <Eye size={11} />
                        Ver
                      </button>
                      {/* Re-analizar IA */}
                      <button
                        onClick={() => handleReanalyze(client.id)}
                        disabled={reanalyzingId === client.id}
                        title="Re-analizar con IA"
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#1E1E1E] text-[#A0A0A0] border border-[#2A2A2A] hover:text-white hover:border-[#3A3A3A] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={11} className={reanalyzingId === client.id ? "animate-spin" : ""} />
                        IA
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#A0A0A0] text-sm">
                    No se encontraron clientes con los filtros aplicados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-[#2A2A2A] flex items-center justify-between">
          <span className="text-xs text-[#A0A0A0]">
            Página {page} de {data.totalPages ?? 0} · {data.total ?? 0} resultado{(data.total ?? 0) !== 1 ? "s" : ""}
          </span>
          {(data.totalPages ?? 0) > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= (data.totalPages ?? 0)}
                className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
