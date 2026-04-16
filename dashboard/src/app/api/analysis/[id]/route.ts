import { analyzeOne } from "@/features/analysis/services/analysis.service";

export const dynamic = "force-dynamic";

// POST /api/analysis/[id] — re-analiza un cliente específico
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await analyzeOne(id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
