import type Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "../types";

export interface BatchInput {
  id: string;
  nombre: string;
  transcripcion: string;
}

export const SYSTEM_PROMPT = `Eres analista de ventas de Vambe (plataforma de automatización de atención al cliente con IA).
Dado un listado de transcripciones de reuniones de ventas, analiza cada cliente y extrae exactamente estos campos:

- industria: finanzas|salud|retail|educacion|logistica|turismo|tecnologia|moda|restaurante|consultoria|otro
- volumenMensajes: bajo|medio|alto (volumen actual de mensajes/consultas que maneja la empresa)
- canalDescubrimiento: referido|google|conferencia|webinar|articulo|redes_sociales|feria|otro
- painPoint: elige EXACTAMENTE uno de estos 8 valores según el problema principal:
  "alto volumen de consultas repetitivas" → equipo desbordado por preguntas frecuentes
  "gestion manual ineficiente" → gestión manual que no escala, genera errores o demoras
  "desbordamiento en temporada pico" → colapso en épocas de alta demanda
  "soporte tecnico desbordado" → consultas técnicas superan la capacidad del equipo
  "gestion de citas y reservas" → agendamiento manual e ineficiente
  "consultas sobre envios y logistica" → volumen de consultas de envíos o rastreo
  "escalado sin aumentar personal" → necesitan crecer atención sin contratar más
  "falta de atencion al cliente 247" → falta de disponibilidad fuera del horario laboral
- integraciones: texto ≤100 chars con sistemas a integrar (ej: "WhatsApp, CRM Salesforce")
- potencial: alta|media|baja — evalúa holísticamente el potencial de cierre considerando urgencia del problema, tamaño del negocio, disposición del cliente y encaje con Vambe
- conclusionEjecutiva: síntesis ejecutiva de 1-2 oraciones ≤200 chars orientada a decisión de ventas
- proximaAccion: acción concreta y específica ≤100 chars que el vendedor debe tomar (ej: "Enviar propuesta con integración WhatsApp esta semana", "Agendar demo técnica con el equipo IT")

Usa solo los valores listados. Si no hay información suficiente, elige el más probable.`;

const CLIENT_ANALYSIS_SCHEMA = {
  type: "object" as const,
  additionalProperties: false as const,
  properties: {
    industria:           { type: "string" as const },
    volumenMensajes:     { type: "string" as const },
    canalDescubrimiento: { type: "string" as const },
    painPoint:           { type: "string" as const },
    integraciones:       { type: "string" as const },
    potencial:           { type: "string" as const },
    conclusionEjecutiva: { type: "string" as const },
    proximaAccion:       { type: "string" as const },
  },
  required: [
    "industria", "volumenMensajes", "canalDescubrimiento",
    "painPoint", "integraciones", "potencial",
    "conclusionEjecutiva", "proximaAccion",
  ],
};

export const CATEGORIZE_TOOL: Anthropic.Tool = {
  name: "categorize_clients",
  description: "Devuelve el análisis de cada cliente en el mismo orden que la entrada.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: CLIENT_ANALYSIS_SCHEMA,
        description: "Array con exactamente N análisis, uno por cada cliente en orden.",
      },
    },
    required: ["results"],
  },
};

export function buildUserMessage(clients: BatchInput[]): string {
  const items = clients
    .map((c, i) => `[${i + 1}] ${c.nombre}\n${c.transcripcion}`)
    .join("\n\n");
  return `Analiza estas ${clients.length} transcripciones:\n\n${items}`;
}

export function parseClaudeResponse(
  response: Anthropic.Message,
  count: number
): AnalysisResult[] {
  if (response.stop_reason !== "tool_use") {
    console.error(`[LLM] stop_reason inesperado: "${response.stop_reason}" (esperado: "tool_use")`);
  }

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    console.error("[LLM] Contenido de la respuesta:", JSON.stringify(response.content, null, 2));
    throw new Error(`Claude no devolvió un tool_use block (stop_reason: ${response.stop_reason})`);
  }

  const results = (toolBlock.input as { results: AnalysisResult[] }).results;

  if (!Array.isArray(results) || results.length !== count) {
    console.error(`[LLM] results recibidos: ${results?.length ?? "undefined"} (esperados: ${count})`);
    console.error("[LLM] input del tool_use:", JSON.stringify(toolBlock.input, null, 2).slice(0, 500));
    throw new Error(
      `Se esperaban ${count} resultados, se recibieron ${results?.length ?? 0}`
    );
  }

  return results;
}
