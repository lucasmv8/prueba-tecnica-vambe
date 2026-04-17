import { anthropic } from "../shared/anthropic";

export interface ComposeInput {
  tipo: "potencial_no_cerrado" | "cierre_bajo_potencial";
  nombre: string;
  vendedor: string;
  industria?: string;
  painPoint?: string;
  conclusionEjecutiva?: string;
  proximaAccion?: string;
}

export interface ComposeResult {
  subject: string;
  body: string;
}

const SYSTEM_PROMPT = `Eres un asistente de ventas B2B que redacta correos en español.
Tus correos son breves, cálidos y profesionales. Nunca mencionas "análisis", "IA" ni datos internos.
Siempre respondes con JSON válido con las claves "subject" y "body".`;

function buildPrompt(input: ComposeInput): string {
  const firstName = input.nombre.split(" ")[0];

  if (input.tipo === "potencial_no_cerrado") {
    return `Redacta un correo de seguimiento para retomar contacto con un prospecto que aún no ha tomado una decisión.

Datos del cliente:
- Nombre: ${input.nombre}
- Industria: ${input.industria ?? "no especificada"}
- Problema principal: ${input.painPoint ?? "no especificado"}
- Próxima acción sugerida: ${input.proximaAccion ?? "agendar una llamada"}
- Vendedor que firma: ${input.vendedor}

El correo debe:
- Saludar a ${firstName} por su nombre
- Mostrar que entendemos su contexto en el sector ${input.industria ?? "su industria"} sin sonar genérico
- Hacer referencia al problema que mencionó de forma natural, sin copiarlo textualmente
- Proponer la próxima acción como una invitación, no como presión de venta
- Tener máximo 4 párrafos cortos
- Firmarse como ${input.vendedor}

Responde solo con JSON: { "subject": "...", "body": "..." }`;
  }

  return `Redacta un correo de seguimiento post-venta para mantener la relación con un cliente ya cerrado.

Datos del cliente:
- Nombre: ${input.nombre}
- Industria: ${input.industria ?? "no especificada"}
- Vendedor que firma: ${input.vendedor}

El correo debe:
- Saludar a ${firstName} por su nombre
- Transmitir que estamos disponibles para acompañarlo en lo que necesite
- Si corresponde, mencionar algo relevante del sector ${input.industria ?? "su industria"} que muestre que entendemos su contexto
- Sonar como un check-in genuino, no como marketing
- Tener máximo 3 párrafos cortos
- Firmarse como ${input.vendedor}

Responde solo con JSON: { "subject": "...", "body": "..." }`;
}

export async function composeEmail(input: ComposeInput): Promise<ComposeResult> {
  if (process.env.DRY_RUN === "true") {
    return {
      subject: `[DRY RUN] Seguimiento — ${input.nombre}`,
      body: `Hola ${input.nombre.split(" ")[0]},\n\nEsto es un mensaje de prueba generado en modo DRY_RUN.\n\nSaludos,\n${input.vendedor}`,
    };
  }

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(input) }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]) as ComposeResult;
  } catch {
    return { subject: `Seguimiento — ${input.nombre}`, body: text };
  }
}
