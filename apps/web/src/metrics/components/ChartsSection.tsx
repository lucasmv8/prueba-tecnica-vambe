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
import { capitalizeFirst } from "@vambe/ui-system";
import { PainPointsCloud } from "./PainPointsCloud";
import { IndustriaChart } from "./IndustriaChart";

const TOOLTIP_STYLE = {
  backgroundColor: "#1E1E1E",
  border: "1px solid #2A2A2A",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "12px",
};

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

// Colores para el embudo: más oscuro = etapa más avanzada
const FUNNEL_COLORS = ["#1D4ED8", "#2563EB", "#3B82F6"];

// Color por close rate: verde si alto, amarillo si medio, rojo si bajo
function closeRateColor(rate: number): string {
  if (rate >= 60) return "#4ADE80";
  if (rate >= 35) return "#FACC15";
  return "#F87171";
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

      {/* ── Embudo de Decisión ───────────────────────────────────────────── */}
      {showResumen && data.byEtapaDecision.length > 0 && (
        <ChartCard title="Leads por Etapa">
          <div className="flex flex-col gap-3">
            {data.byEtapaDecision.map(({ label, total, cerrados, closeRate }, i) => {
              const maxTotal = Math.max(...data.byEtapaDecision.map((e) => e.total));
              const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
              const openLeads = total - cerrados;
              return (
                <div key={label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A0A0A0]">{label}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#4ADE80]" title="Cerrados">{cerrados} ganados</span>
                      <span className="text-[#505050]">·</span>
                      <span className="text-[#606060]" title="Abiertos">{openLeads} abiertos</span>
                      <span
                        className="font-semibold w-9 text-right"
                        style={{ color: closeRateColor(closeRate) }}
                      >
                        {closeRate}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-7">
                    <div className="absolute inset-0 bg-[#1E1E1E] rounded-md" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-md transition-all duration-500 flex items-center"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${FUNNEL_COLORS[i] ?? "#3B82F6"}, ${FUNNEL_COLORS[i] ?? "#3B82F6"}99)`,
                        minWidth: "2.5rem",
                      }}
                    >
                      <span className="text-xs font-semibold text-white px-2 whitespace-nowrap">
                        {total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#505050] mt-3">
            % tasa de cierre por etapa
          </p>
        </ChartCard>
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
