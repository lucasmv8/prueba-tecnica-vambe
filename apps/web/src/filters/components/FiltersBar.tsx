"use client";

import { Search, X } from "lucide-react";
import type { FilterState } from "@vambe/domain";
import { capitalizeFirst } from "@vambe/ui-system";

interface FilterGroup {
  key: keyof Omit<FilterState, "q" | "page">;
  label: string;
  options: string[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "vendedor",
    label: "Vendedor",
    options: ["Toro", "Puma", "Zorro", "Boa", "Tiburón"],
  },
  {
    key: "closed",
    label: "Estado",
    options: ["true:Cerrado", "false:Abierto"],
  },
  {
    key: "industria",
    label: "Industria",
    options: [
      "finanzas",
      "salud",
      "retail",
      "educacion",
      "logistica",
      "turismo",
      "tecnologia",
      "moda",
      "restaurante",
      "consultoria",
    ],
  },
  {
    key: "urgencia",
    label: "Urgencia",
    options: ["alta", "media", "baja"],
  },
  {
    key: "etapaDecision",
    label: "Etapa",
    options: ["explorando", "evaluando:Analizando", "listo_para_comprar:Listo para comprar"],
  },
];

interface FiltersBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  const activeCount = [
    filters.vendedor,
    filters.industria,
    filters.closed,
    filters.urgencia,
    filters.etapaDecision,
    filters.q,
  ].filter(Boolean).length;

  const setValue = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const clearAll = () => {
    onChange({ vendedor: "", industria: "", closed: "", urgencia: "", etapaDecision: "", q: "", page: 1 });
  };

  return (
    <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={filters.q}
          onChange={(e) => setValue("q", e.target.value)}
          className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg pl-8 pr-4 py-2 text-sm text-white placeholder:text-[#A0A0A0] focus:outline-none focus:border-[#2563EB] transition-colors"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        {FILTER_GROUPS.map(({ key, label, options }) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-xs text-[#A0A0A0] mr-1">{label}:</span>
            <div className="flex flex-wrap gap-1">
              {options.map((opt) => {
                const [value, display] = opt.includes(":") ? opt.split(":") : [opt, opt];
                const isActive = filters[key] === value;
                return (
                  <button
                    key={value}
                    onClick={() => setValue(key, isActive ? "" : value)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#1E1E1E] text-[#A0A0A0] hover:text-white hover:bg-[#2A2A2A] border border-[#2A2A2A]"
                    }`}
                  >
                    {capitalizeFirst(display)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-red-400 hover:text-red-300 border border-[#2A2A2A] hover:border-red-900 transition-colors ml-2 cursor-pointer"
          >
            <X size={10} />
            Limpiar ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
