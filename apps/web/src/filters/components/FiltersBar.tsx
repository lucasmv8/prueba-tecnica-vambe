"use client";

import { Search, X } from "lucide-react";
import type { FilterState } from "@vambe/domain";
import { capitalizeFirst } from "@vambe/ui-system";
import {
  VENDOR_OPTIONS,
  INDUSTRY_OPTIONS,
  ESTADO_OPTIONS,
  POTENCIAL_OPTIONS,
} from "@/filters/lib/filter-options";

interface FilterGroup {
  key: keyof Omit<FilterState, "q" | "page">;
  label: string;
  options: string[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "vendedor",
    label: "Vendedor",
    options: [...VENDOR_OPTIONS],
  },
  {
    key: "closed",
    label: "Estado",
    options: ESTADO_OPTIONS.map((o) => `${o.value}:${o.label}`),
  },
  {
    key: "industria",
    label: "Industria",
    options: [...INDUSTRY_OPTIONS],
  },
  {
    key: "potencial",
    label: "Potencial",
    options: [...POTENCIAL_OPTIONS],
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
    filters.potencial,
    filters.q,
  ].filter(Boolean).length;

  const setValue = (key: keyof FilterState, value: string) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const clearAll = () => {
    onChange({ vendedor: "", industria: "", closed: "", potencial: "", q: "", page: 1 });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={filters.q}
          onChange={(e) => setValue("q", e.target.value)}
          className="w-full bg-secondary border border-border rounded-lg pl-8 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB] transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {FILTER_GROUPS.map(({ key, label, options }) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">{label}:</span>
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
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
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
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs text-red-400 hover:text-red-300 border border-border hover:border-red-900 transition-colors ml-2 cursor-pointer"
          >
            <X size={10} />
            Limpiar ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
