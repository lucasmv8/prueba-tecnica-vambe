import type Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "../types";

export interface BatchInput {
  id: string;
  nombre: string;
  transcripcion: string;
}

// Prompt compacto: define las 11 dimensiones con valores exactos (~300 tokens)
export const SYSTEM_PROMPT = `Eres analista de ventas de Vambe (plataforma de automatización de atención al cliente con IA).
Dado un listado de transcripciones de reuniones de ventas, categoriza cada cliente con exactamente estos valores:

- industria: finanzas|salud|retail|educacion|logistica|turismo|tecnologia|moda|restaurante|consultoria|otro
- tamanioEmpresa: startup|pequena|mediana|grande
- volumenMensajes: bajo|medio|alto
- canalDescubrimiento: referido|google|conferencia|webinar|articulo|redes_sociales|feria|otro
- painPoint: elige EXACTAMENTE uno de estos 8 valores según el problema principal descrito en la transcripción:
  "alto volumen de consultas repetitivas" → cuando el equipo está desbordado por preguntas frecuentes y repetitivas
  "gestion manual ineficiente" → cuando la gestión manual de interacciones ya no escala y genera errores o demoras
  "desbordamiento en temporada pico" → cuando en épocas específicas (promociones, admisiones, temporada alta) la capacidad colapsa
  "soporte tecnico desbordado" → cuando las consultas técnicas o de soporte superan la capacidad del equipo
  "gestion de citas y reservas" → cuando la gestión de citas, reservas o agendamiento es manual e ineficiente
  "consultas sobre envios y logistica" → cuando el volumen de consultas sobre envíos, rastreo o logística es el problema central
  "escalado sin aumentar personal" → cuando necesitan crecer la atención al cliente sin contratar más personas
  "falta de atencion al cliente 247" → cuando la falta de disponibilidad fuera del horario laboral es el problema clave
- integraciones: texto ≤100 chars con sistemas a integrar
- objeciones: privacidad|costo|adopcion_equipo|integracion_tecnica|sin_objeciones|multiple
- urgencia: alta|media|baja (qué tan urgente es para el cliente resolver este problema ahora)
- etapaDecision: etapa en la que está el cliente respecto a CONTRATAR VAMBE específicamente:
  "explorando" → recién descubrió que necesita una solución, aún no está evaluando proveedores en serio
  "evaluando" → está comparando opciones activamente, ya tiene criterios de decisión, considera seriamente a Vambe
  "listo_para_comprar" → ya decidió que quiere automatizar con Vambe, la conversación es sobre precio, implementación o detalles finales
- resumenLLM: insight ejecutivo 1-2 oraciones ≤200 chars para el equipo de ventas

Usa solo los valores listados. Si no hay información suficiente, elige el más probable.`;

// Tool schema para forzar output JSON estructurado via tool_use
const CLIENT_ANALYSIS_SCHEMA = {
  type: "object" as const,
  additionalProperties: false as const,
  properties: {
    industria: { type: "string" as const },
    tamanioEmpresa: { type: "string" as const },
    volumenMensajes: { type: "string" as const },
    canalDescubrimiento: { type: "string" as const },
    painPoint: { type: "string" as const },
    integraciones: { type: "string" as const },
    objeciones: { type: "string" as const },
    urgencia: { type: "string" as const },
    etapaDecision: { type: "string" as const },
    resumenLLM: { type: "string" as const },
  },
  required: [
    "industria", "tamanioEmpresa", "volumenMensajes", "canalDescubrimiento",
    "painPoint", "integraciones", "objeciones", "urgencia",
    "etapaDecision", "resumenLLM",
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
  // Log stop_reason para detectar truncamiento por max_tokens
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
