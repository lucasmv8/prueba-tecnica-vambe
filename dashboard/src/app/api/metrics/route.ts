import { getMetrics } from "@/features/metrics/services/metrics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const metrics = await getMetrics();
    return Response.json(metrics);
  } catch (error) {
    return Response.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}
