import { getMetrics } from "@vambe/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getMetrics();
    return Response.json(metrics);
  } catch {
    return Response.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}
