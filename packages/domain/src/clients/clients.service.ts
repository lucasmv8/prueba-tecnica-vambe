import { prisma, type Prisma } from "@vambe/database";
import type { ClientFilters, ClientsResponse } from "./types";

function computeLeadScore(analysis: {
  potencial: string;
  volumenMensajes: string;
} | null): number | null {
  if (!analysis) return null;
  const p = { alta: 60, media: 35, baja: 10 }[analysis.potencial] ?? 0;
  const v = { alto: 40, medio: 22, bajo: 8 }[analysis.volumenMensajes] ?? 0;
  return p + v;
}

export async function getClients(filters: ClientFilters): Promise<ClientsResponse> {
  const {
    vendedor,
    industria,
    closed,
    potencial,
    q,
    painPoint,
    calificado,
    page = 1,
    pageSize = 10,
  } = filters;

  const where: Prisma.ClientWhereInput = {};
  const analysisFilter: Prisma.ClientAnalysisWhereInput = {};

  if (calificado) {
    where.closed = false;
    analysisFilter.potencial = "alta";
  } else {
    if (vendedor) where.vendedor = vendedor;
    if (closed !== undefined && closed !== "") where.closed = closed === "true";
    if (industria) analysisFilter.industria = industria;
    if (potencial) analysisFilter.potencial = potencial;
    if (painPoint) analysisFilter.painPoint = { contains: painPoint };
  }

  if (Object.keys(analysisFilter).length > 0) {
    where.analysis = { is: analysisFilter };
  }

  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { correo: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      include: { analysis: true },
      orderBy: { fechaReunion: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    clients: clients.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      correo: c.correo,
      telefono: c.telefono,
      fechaReunion: c.fechaReunion.toISOString(),
      vendedor: c.vendedor,
      closed: c.closed,
      transcripcion: c.transcripcion,
      hasDuplicateEmail: c.hasDuplicateEmail,
      analysis: c.analysis
        ? { ...c.analysis, analyzedAt: c.analysis.analyzedAt.toISOString() }
        : null,
      leadScore: computeLeadScore(c.analysis),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
