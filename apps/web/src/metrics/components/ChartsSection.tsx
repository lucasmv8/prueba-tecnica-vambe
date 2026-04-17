"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell,
} from "recharts";
import type { MetricsData } from "@vambe/domain";
import { capitalizeFirst, TOOLTIP_STYLE } from "@vambe/ui-system";
import { PainPointsCloud } from "./PainPointsCloud";
import { IndustriaChart } from "./IndustriaChart";

const AXIS_STYLE = { fill: "#A0A0A0", fontSize: 11 };

function ChartCard({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`bg-[#161616] border border-[#2A2A2A] rounded-xl p-5 ${fullWidth ? "lg:col-span-2" : ""}`}>
      <h3 className="text-sm font-medium text-[#A0A0A0] mb-4 uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface Props {
  data: MetricsData;
  view?: "resumen" | "analisis" | "all";
}

export function ChartsSection({ data, view = "all" }: Props) {
  const vendedorData = data.byVendedor.map((d) => ({
    ...d,
    name: capitalizeFirst(d.name),
  }));

  const showResumen = view === "resumen" || view === "all";
  const showAnalisis = view === "analisis" || view === "all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

      {/* ── Pain Points Cloud ────────────────────────────────────────────── */}
      {showAnalisis && data.topPainPoints.length > 0 && (
        <PainPointsCloud painPoints={data.topPainPoints} />
      )}

      {/* ── Close Rate por Industria ─────────────────────────────────────── */}
      {showAnalisis && <IndustriaChart data={data.byIndustria} />}

      {/* ── Performance por Vendedor ─────────────────────────────────────── */}
      {showResumen && <ChartCard title="Performance por Vendedor">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={vendedorData} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="name" tick={AXIS_STYLE} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "transparent" }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Total" fill="#4B5563" activeBar={{ fill: "#6B7280" }}>
              {vendedorData.map((_, i) => (
                <Cell key={i} fill="#4B5563" />
              ))}
            </Bar>
            <Bar dataKey="cerrados" radius={[4, 4, 0, 0]} name="Cerrados" fill="#2563EB" activeBar={{ fill: "#3B82F6" }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>}

      {/* ── Reuniones por Mes ────────────────────────────────────────────── */}
      {showResumen && <ChartCard title="Reuniones por Mes" fullWidth>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.byMonth} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="month" tick={{ ...AXIS_STYLE, fontSize: 10 }} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "transparent" }} />
            <Bar dataKey="reuniones" fill="#2563EB" radius={[4, 4, 0, 0]} name="Reuniones" activeBar={{ fill: "#3B82F6" }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>}

      {/* ── Tasa de Conversión Mensual ───────────────────────────────────── */}
      {showResumen && <ChartCard title="Tasa de Conversión Mensual" fullWidth>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data.byMonth} margin={{ left: -10, right: 16, top: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="month" tick={{ ...AXIS_STYLE, fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={AXIS_STYLE} tickFormatter={(v) => `${v}%`} padding={{ top: 12 }} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${value}%`, "Conv. %"]}
            />
            <Line
              type="monotone"
              dataKey="closeRate"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: "#10B981", r: 4, strokeWidth: 0 }}
              name="Conv. %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>}

    </div>
  );
}
