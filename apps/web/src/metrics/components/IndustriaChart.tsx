"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { BarChartEntry } from "@vambe/domain";
import { capitalizeFirst, CHART_COLORS, TOOLTIP_STYLE } from "@vambe/ui-system";
import { ToggleGroup } from "@/shared/components/ToggleGroup";

type ViewMode = "closeRate" | "cantidad";

interface IndustriaChartProps {
  data: BarChartEntry[];
}

const INDUSTRIA_TOGGLE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "closeRate", label: "Close Rate" },
  { value: "cantidad", label: "Cantidad" },
];

export function IndustriaChart({ data }: IndustriaChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("closeRate");

  if (data.length === 0) return null;

  const sortedByClose = [...data].sort((a, b) => b.closeRate - a.closeRate);
  const sortedByTotal = [...data].sort((a, b) => b.total - a.total);

  const pieData = sortedByTotal.map((d) => ({
    name: capitalizeFirst(d.name),
    value: d.total,
  }));

  const totalClients = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <h3 className="text-base font-semibold text-white">Close Rate por Industria</h3>

        <ToggleGroup
          options={INDUSTRIA_TOGGLE_OPTIONS}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      <div className="border-t border-[#1E1E1E]">
        {viewMode === "closeRate" ? (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_40px] gap-3 px-5 py-1.5 border-b border-[#1E1E1E]">
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider">Industria</span>
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider">% Cierre</span>
              <span className="text-[10px] font-medium text-[#505050] uppercase tracking-wider text-right">Rate</span>
            </div>
            {sortedByClose.map(({ name, closeRate }) => (
              <div
                key={name}
                className="grid grid-cols-[1fr_1fr_40px] gap-3 items-center px-5 py-2.5 border-b border-[#1E1E1E] last:border-0"
              >
                <span className="text-xs text-[#A0A0A0] truncate">{capitalizeFirst(name)}</span>
                <div className="h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${closeRate}%`,
                      background: "linear-gradient(90deg, #1D4ED8, #3B82F6)",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-white text-right shrink-0">
                  {closeRate}%
                </span>
              </div>
            ))}
          </>
        ) : (
          /* Pie chart view */
          <div className="px-5 py-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => {
                    const n = Number(value);
                    return [`${n} clientes (${totalClients > 0 ? Math.round((n / totalClients) * 100) : 0}%)`, "Total"];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Leyenda */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              {pieData.map(({ name, value }, i) => (
                <div key={name} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-[#A0A0A0] truncate">{name}</span>
                  <span className="text-xs font-semibold text-white ml-auto shrink-0">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
