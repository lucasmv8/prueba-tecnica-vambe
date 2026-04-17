import { prisma } from "@vambe/database";
import type { MetricsData, BarChartEntry, DuplicateEmailGroup, PainPointEntry, AlertEntry } from "./types";

function computeCloseRate(total: number, closed: number) {
  return total === 0 ? 0 : Math.round((closed / total) * 100);
}

export async function getMetrics(): Promise<MetricsData> {
  const allClients = await prisma.client.findMany({
    select: {
      id: true,
      closed: true,
      vendedor: true,
      fechaReunion: true,
      correo: true,
      nombre: true,
      hasDuplicateEmail: true,
      analysis: {
        select: {
          industria: true,
          painPoint: true,
          potencial: true,
          analyzedAt: true,
          conclusionEjecutiva: true,
          proximaAccion: true,
        },
      },
    },
  });

  const total = allClients.length;
  const closed = allClients.filter((c) => c.closed).length;
  const pending = allClients.filter((c) => !c.analysis).length;

  const leadsCalificados = allClients.filter(
    (c) => !c.closed && c.analysis?.potencial === "alta"
  ).length;

  // ── By Industria ───────────────────────────────────────────────────────────
  const industriaMap = new Map<string, { total: number; closed: number }>();
  for (const c of allClients) {
    const key = c.analysis?.industria ?? "Sin categorizar";
    const entry = industriaMap.get(key) ?? { total: 0, closed: 0 };
    entry.total++;
    if (c.closed) entry.closed++;
    industriaMap.set(key, entry);
  }

  // ── By Vendedor ────────────────────────────────────────────────────────────
  const vendedorMap = new Map<string, { total: number; closed: number }>();
  for (const c of allClients) {
    const key = c.vendedor ?? "Desconocido";
    const entry = vendedorMap.get(key) ?? { total: 0, closed: 0 };
    entry.total++;
    if (c.closed) entry.closed++;
    vendedorMap.set(key, entry);
  }
  const byVendedor: BarChartEntry[] = Array.from(vendedorMap.entries()).map(
    ([name, { total, closed }]) => ({
      name,
      total,
      cerrados: closed,
      closeRate: computeCloseRate(total, closed),
    })
  );

  const topVendedorEntry =
    byVendedor
      .filter((v) => v.total >= 3)
      .sort((a, b) => b.closeRate - a.closeRate)[0];
  const topVendedor = topVendedorEntry?.name ?? "-";
  const topVendedorCloseRate = topVendedorEntry?.closeRate ?? 0;

  // ── By Month ───────────────────────────────────────────────────────────────
  const monthMap = new Map<string, { total: number; closed: number }>();
  for (const c of allClients) {
    const date = new Date(c.fechaReunion);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key) ?? { total: 0, closed: 0 };
    entry.total++;
    if (c.closed) entry.closed++;
    monthMap.set(key, entry);
  }
  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { total, closed }]) => ({
      month,
      reuniones: total,
      cerrados: closed,
      closeRate: computeCloseRate(total, closed),
    }));

  const byIndustria: BarChartEntry[] = Array.from(industriaMap.entries())
    .map(([name, { total, closed }]) => ({
      name,
      total,
      cerrados: closed,
      closeRate: computeCloseRate(total, closed),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const topIndustriaEntry =
    byIndustria
      .filter((i) => i.total >= 2 && i.name !== "Sin categorizar")
      .sort((a, b) => b.closeRate - a.closeRate)[0];
  const topIndustria = topIndustriaEntry?.name ?? "-";
  const topIndustriaCloseRate = topIndustriaEntry?.closeRate ?? 0;

  // ── Duplicate Emails ───────────────────────────────────────────────────────
  const emailGroupMap = new Map<string, string[]>();
  for (const c of allClients) {
    if (!c.hasDuplicateEmail) continue;
    const group = emailGroupMap.get(c.correo) ?? [];
    group.push(c.nombre);
    emailGroupMap.set(c.correo, group);
  }
  const duplicateEmails: DuplicateEmailGroup[] = Array.from(emailGroupMap.entries()).map(
    ([correo, clientes]) => ({ correo, clientes })
  );

  // ── Pain Points ────────────────────────────────────────────────────────────
  const painPointMap = new Map<string, { count: number; cerrados: number }>();
  for (const c of allClients) {
    if (!c.analysis?.painPoint) continue;
    const normalized = c.analysis.painPoint.trim().toLowerCase().normalize("NFC").replace(/[.,;!?]+$/, "").replace(/\s+/g, " ");
    if (normalized.length > 3) {
      const entry = painPointMap.get(normalized) ?? { count: 0, cerrados: 0 };
      entry.count++;
      if (c.closed) entry.cerrados++;
      painPointMap.set(normalized, entry);
    }
  }
  const topPainPoints: PainPointEntry[] = Array.from(painPointMap.entries())
    .map(([text, { count, cerrados }]) => ({
      text,
      count,
      cerrados,
      closeRate: computeCloseRate(count, cerrados),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Señales de Atención ────────────────────────────────────────────────────
  const alertas: AlertEntry[] = [];
  for (const c of allClients) {
    if (!c.analysis) continue;
    const { potencial } = c.analysis;
    if (!c.closed && potencial === "alta") {
      alertas.push({
        clientId: c.id,
        nombre: c.nombre,
        correo: c.correo,
        vendedor: c.vendedor,
        tipo: "potencial_no_cerrado",
        etiqueta: "Alto potencial sin cierre",
        severidad: "warning",
        industria: c.analysis.industria,
        painPoint: c.analysis.painPoint,
        conclusionEjecutiva: c.analysis.conclusionEjecutiva,
        proximaAccion: c.analysis.proximaAccion,
      });
    } else if (c.closed && potencial === "baja") {
      alertas.push({
        clientId: c.id,
        nombre: c.nombre,
        correo: c.correo,
        vendedor: c.vendedor,
        tipo: "cierre_bajo_potencial",
        etiqueta: "Cierre con potencial bajo",
        severidad: "info",
        industria: c.analysis.industria,
        painPoint: c.analysis.painPoint,
        conclusionEjecutiva: c.analysis.conclusionEjecutiva,
        proximaAccion: c.analysis.proximaAccion,
      });
    }
  }

  return {
    kpis: {
      totalClients: total,
      closeRate: computeCloseRate(total, closed),
      topVendedor,
      topVendedorCloseRate,
      topIndustria,
      topIndustriaCloseRate,
      leadsCalificados,
      pendingAnalysis: pending,
    },
    byIndustria,
    byVendedor,
    byMonth,
    duplicateEmails,
    topPainPoints,
    alertas,
  };
}
