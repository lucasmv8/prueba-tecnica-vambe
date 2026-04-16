import { getClients } from "@/features/clients/services/clients.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const clients = await getClients({
      vendedor: searchParams.get("vendedor") ?? undefined,
      industria: searchParams.get("industria") ?? undefined,
      closed: searchParams.get("closed") ?? undefined,
      urgencia: searchParams.get("urgencia") ?? undefined,
      etapaDecision: searchParams.get("etapaDecision") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      painPoint: searchParams.get("painPoint") ?? undefined,
      calificado: searchParams.get("calificado") === "true",
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 10),
    });

    return Response.json(clients);
  } catch (error) {
    return Response.json({ error: "Error al obtener clientes" }, { status: 500 });
  }
}
