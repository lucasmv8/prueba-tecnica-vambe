"use client";

import { useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, X, Brain, Eye, Search, ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import type { Client, ClientsResponse, FilterState } from "@vambe/domain";
import { formatDate, capitalizeFirst, POTENTIAL_COLORS } from "@vambe/ui-system";
import {
  VENDOR_OPTIONS,
  INDUSTRY_OPTIONS,
  ESTADO_OPTIONS,
  POTENCIAL_OPTIONS,
} from "@/filters/lib/filter-options";

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
    options: [...VENDOR_OPTIONS].map((v) => ({ value: v, label: v })),
  },
  {
    key: "industria",
    label: "Industria",
    options: [...INDUSTRY_OPTIONS].map((v) => ({ value: v, label: capitalizeFirst(v) })),
  },
  {
    key: "closed",
    label: "Estado",
    options: [...ESTADO_OPTIONS],
  },
  {
    key: "potencial",
    label: "Potencial",
    options: [...POTENCIAL_OPTIONS].map((v) => ({ value: v, label: capitalizeFirst(v) })),
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
  useBodyScrollLock();

  const handleReanalyze = async () => {
    setLoading(true);
    try { await onReanalyze(client.id); } finally { setLoading(false); }
  };

  const a = client.analysis;

  const metaFields = [
    { label: "Industria",  value: a?.industria },
    { label: "Volumen",    value: a?.volumenMensajes },
    { label: "Canal",      value: a?.canalDescubrimiento },
    { label: "Potencial",  value: a?.potencial, colorMap: POTENTIAL_COLORS },
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
              {a?.potencial && (
                <Tag value={a.potencial} colorMap={POTENTIAL_COLORS} />
              )}
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
          {a ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={12} className="text-[#A855F7]" />
                <h4 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">Análisis IA</h4>
              </div>

              {/* Lectura de negocio */}
              <div className="space-y-2">
                {a.conclusionEjecutiva && (
                  <p className="text-xs text-white bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-lg px-3 py-2 leading-relaxed">
                    {a.conclusionEjecutiva}
                  </p>
                )}
                {a.proximaAccion && (
                  <div className="flex items-start gap-2 bg-[#10B981]/8 border border-[#10B981]/20 rounded-lg px-3 py-2">
                    <ArrowRight size={11} className="text-[#10B981] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#10B981] uppercase tracking-wider font-medium mb-0.5">
                        Próxima acción
                      </div>
                      <p className="text-xs text-[#C0C0C0]">{a.proximaAccion}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-2">
                {metaFields.map(({ label, value, colorMap }) => (
                  <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
                    <div className="text-[10px] text-[#505050] uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-xs text-white">
                      {value
                        ? colorMap
                          ? <Tag value={value} colorMap={colorMap} />
                          : capitalizeFirst(value)
                        : <span className="text-[#A0A0A0]">—</span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {a.painPoint && (
                <div className="bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-[#A855F7] uppercase tracking-wider mb-1">Pain Point</div>
                  <p className="text-xs text-[#C0C0C0]">{a.painPoint}</p>
                </div>
              )}
              {a.integraciones && (
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
                  <div className="text-[10px] text-[#505050] uppercase tracking-wider mb-0.5">Integraciones</div>
                  <div className="text-xs text-white">{capitalizeFirst(a.integraciones)}</div>
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
                {["Cliente", "Industria", "Vendedor", "Fecha", "Estado", "Potencial", ""].map((h) => (
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
                    <Tag value={client.analysis?.industria ?? null} />
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
                    <div className="flex items-center gap-1.5">
                      <Tag value={client.analysis?.potencial ?? null} colorMap={POTENTIAL_COLORS} />
                      {client.leadScore !== null && (
                        <span className="text-[10px] text-[#505050]">{client.leadScore}pts</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#2563EB]/10 text-[#60A5FA] border border-[#2563EB]/25 hover:bg-[#2563EB]/20 hover:border-[#2563EB]/50 transition-colors cursor-pointer"
                      >
                        <Eye size={11} />
                        Ver
                      </button>
                      <button
                        onClick={() => handleReanalyze(client.id)}
                        disabled={reanalyzingId === client.id}
                        title={client.analysis === null ? "Analizar con IA" : "Re-analizar con IA"}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#1E1E1E] text-[#A0A0A0] border border-[#2A2A2A] hover:text-white hover:border-[#3A3A3A] disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {reanalyzingId === client.id ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : client.analysis === null ? (
                          <Sparkles size={11} />
                        ) : (
                          <RefreshCw size={11} />
                        )}
                        {client.analysis === null ? "Analizar" : "Re-analizar"}
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
