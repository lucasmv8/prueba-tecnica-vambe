import { composeEmail } from "@vambe/domain";
import type { ComposeInput } from "@vambe/domain";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComposeInput;
    const result = await composeEmail(body);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Error al generar el mensaje" }, { status: 500 });
  }
}
