import { analyzeAll, getPendingCount } from "@vambe/domain";

export const dynamic = "force-dynamic";

// GET /api/analysis — retorna conteo de clientes pendientes
export async function GET() {
  try {
    const pending = await getPendingCount();
    return Response.json({ pending });
  } catch {
    return Response.json({ error: "Error al obtener pendientes" }, { status: 500 });
  }
}

// POST /api/analysis — inicia análisis con Server-Sent Events
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const force = Boolean(body.force);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        await analyzeAll(force, (progress) => {
          send(progress);
        });
        send({ status: "completed" });
      } catch (error) {
        send({ status: "error", error: String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
