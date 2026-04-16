import { prisma } from "@vambe/database";
import type { MetricsData, BarChartEntry, DuplicateEmailGroup, PainPointEntry, FunnelEntry } from "./types";

function computeCloseRate(total: number, closed: number) {
  return total === 0 ? 0 : Math.round((closed / total) * 100);
}

const ETAPA_ORDER: { stage: string; label: string }[] = [
  { stage: "explorando",         label: "Explorando" },
  { stage: "evaluando",          label: "Evaluando" },
  { stage: "listo_para_comprar", label: "Listo para comprar" },
];

export async function getMetrics(): Promise<MetricsData> {
  const allClients = await prisma.client.findMany({
    select: {
      closed: true,
      vendedor: true,
      industria: true,
      canalDescubrimiento: true,
      fechaReunion: true,
      analyzedAt: true,
      correo: true,
      nombre: true,
      hasDuplicateEmail: true,
      painPoint: true,
      urgencia: true,
      etapaDecision: true,
    },
  });

  const total = allClients.length;
  const closed = allClients.filter((c) => c.closed).length;
  const pending = allClients.filter((c) => !c.analyzedAt).length;

  const leadsCalificados = allClients.filter(
    (c) =>
      !c.closed &&
      c.analyzedAt &&
      (c.urgencia === "alta" ||
        c.etapaDecision === "listo_para_comprar" ||
        c.etapaDecision === "evaluando")
  ).length;

  // ── By Industria (map only — final array built after byMonth) ──────────────
  const industriaMap = new Map<string, { total: number; closed: number }>();
  for (const c of allClients) {
    const key = c.industria ?? "Sin categorizar";
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

  // ── By Etapa de Decisión (Embudo) ──────────────────────────────────────────
  const etapaMap = new Map<string, { total: number; closed: number }>();
  for (const c of allClients) {
    if (!c.analyzedAt || !c.etapaDecision) continue;
    const entry = etapaMap.get(c.etapaDecision) ?? { total: 0, closed: 0 };
    entry.total++;
    if (c.closed) entry.closed++;
    etapaMap.set(c.etapaDecision, entry);
  }
  const byEtapaDecision: FunnelEntry[] = ETAPA_ORDER
    .filter(({ stage }) => etapaMap.has(stage))
    .map(({ stage, label }) => {
      const { total, closed } = etapaMap.get(stage)!;
      return { stage, label, total, cerrados: closed, closeRate: computeCloseRate(total, closed) };
    });

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

  // ── Pain Points con tasa de cierre ────────────────────────────────────────
  const painPointMap = new Map<string, { count: number; cerrados: number }>();
  for (const c of allClients) {
    if (!c.painPoint || !c.analyzedAt) continue;
    const normalized = c.painPoint.trim().toLowerCase().normalize("NFC").replace(/[.,;!?]+$/, "").replace(/\s+/g, " ");
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
    byEtapaDecision,
    duplicateEmails,
    topPainPoints,
  };
}
