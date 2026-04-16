import { prisma, type Prisma } from "@vambe/database";
import type { ClientFilters, ClientsResponse } from "./types";

function computeLeadScore(c: {
  urgencia: string | null;
  etapaDecision: string | null;
  volumenMensajes: string | null;
  analyzedAt: Date | null;
}): number | null {
  if (!c.analyzedAt) return null;
  const u = { alta: 45, media: 28, baja: 10 }[c.urgencia ?? ""] ?? 0;
  const e = { listo_para_comprar: 40, evaluando: 22, explorando: 8 }[c.etapaDecision ?? ""] ?? 0;
  const v = { alto: 15, medio: 7, bajo: 2 }[c.volumenMensajes ?? ""] ?? 0;
  return u + e + v;
}

export async function getClients(filters: ClientFilters): Promise<ClientsResponse> {
  const {
    vendedor,
    industria,
    closed,
    urgencia,
    etapaDecision,
    q,
    painPoint,
    calificado,
    page = 1,
    pageSize = 10,
  } = filters;

  const where: Prisma.ClientWhereInput = {};

  if (calificado) {
    where.closed = false;
    where.analyzedAt = { not: null };
    where.OR = [
      { urgencia: "alta" },
      { etapaDecision: "evaluando" },
      { etapaDecision: "listo_para_comprar" },
    ];
  } else {
    if (vendedor) where.vendedor = vendedor;
    if (industria) where.industria = industria;
    if (urgencia) where.urgencia = urgencia;
    if (etapaDecision) where.etapaDecision = etapaDecision;
    if (closed !== undefined && closed !== "") where.closed = closed === "true";
    if (painPoint) where.painPoint = { contains: painPoint };
  }

  if (q) {
    where.OR = [
      { nombre: { contains: q } },
      { correo: { contains: q } },
    ];
  }

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { fechaReunion: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    clients: clients.map((c) => ({
      ...c,
      fechaReunion: c.fechaReunion.toISOString(),
      analyzedAt: c.analyzedAt?.toISOString() ?? null,
      leadScore: computeLeadScore(c),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
