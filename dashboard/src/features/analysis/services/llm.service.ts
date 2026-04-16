import { anthropic } from "@/infrastructure/llm/anthropic";
import {
  SYSTEM_PROMPT,
  CATEGORIZE_TOOL,
  buildUserMessage,
  parseClaudeResponse,
  type BatchInput,
} from "../prompts/categorize.prompt";
import type { AnalysisResult } from "../types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let callCount = 0; // contador global de llamadas reales a la API

/**
 * Modo DRY_RUN=true: intercepta la llamada, loguea lo que se enviaría
 * y devuelve datos mock. No hace ninguna llamada real a Claude.
 */
function dryRunBatch(clients: BatchInput[]): AnalysisResult[] {
  callCount++;
  const userMsg = buildUserMessage(clients);
  const inputTokensEst = Math.round(
    (SYSTEM_PROMPT.length + userMsg.length) / 4
  );
  const outputTokensEst = clients.length * 90; // ~90 tokens por cliente en output

  console.log(`\n${"═".repeat(60)}`);
  console.log(`[DRY RUN] Llamada #${callCount} a Claude API`);
  console.log(`  Modelo:         claude-haiku-4-5-20251001`);
  console.log(`  Clientes:       ${clients.length} (${clients.map((c) => c.nombre).join(", ")})`);
  console.log(`  Tokens input:   ~${inputTokensEst.toLocaleString()} (system cacheado + transcripciones)`);
  console.log(`  Tokens output:  ~${outputTokensEst.toLocaleString()}`);
  console.log(`  Costo estimado: ~$${((inputTokensEst * 0.0000008) + (outputTokensEst * 0.000004)).toFixed(4)}`);
  console.log(`${"═".repeat(60)}\n`);

  // Datos mock realistas para que el dashboard funcione completo
  return clients.map((c) => ({
    industria: "tecnologia",
    tamanioEmpresa: "mediana",
    volumenMensajes: "medio",
    canalDescubrimiento: "referido",
    painPoint: `[DRY RUN] Pain point de ${c.nombre}`,
    integraciones: "CRM, WhatsApp",
    objeciones: "costo",
    urgencia: "media",
    etapaDecision: "evaluando",
    sentimiento: "positivo",
    resumenLLM: `[DRY RUN] Cliente ${c.nombre} procesado en modo simulación.`,
  }));
}

/**
 * Analiza N clientes en UNA SOLA llamada a Claude.
 * Usa tool_use forzado → JSON garantizado.
 * Usa cache_control en el system prompt → retries cuestan 10% del input.
 *
 * Con DRY_RUN=true en .env.local: simula el flujo completo sin llamar a Claude.
 */
export async function analyzeBatch(
  clients: BatchInput[],
  maxRetries = 2
): Promise<AnalysisResult[]> {
  if (process.env.DRY_RUN === "true") {
    return dryRunBatch(clients);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      callCount++;
      console.log(`[LLM] Llamada #${callCount} — ${clients.length} clientes`);
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000, // Haiku límite real: 8192; dejamos margen de seguridad
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [CATEGORIZE_TOOL],
        tool_choice: { type: "tool", name: "categorize_clients" },
        messages: [
          { role: "user", content: buildUserMessage(clients) },
        ],
      });

      console.log(`[LLM] Respuesta recibida — stop_reason: ${response.stop_reason}, usage: ${JSON.stringify(response.usage)}`);
      return parseClaudeResponse(response, clients.length);
    } catch (error: unknown) {
      const status = (error as any)?.status ?? (error as any)?.statusCode;
      const msg = String((error as any)?.message ?? "");

      // 529: API sobrecargada → esperar 30s y reintentar
      if (status === 529 && attempt < maxRetries) {
        console.log(`[LLM] API sobrecargada, esperando 30s (intento ${attempt + 1}/${maxRetries})`);
        await sleep(30_000);
        continue;
      }

      // 429: rate limit → leer retry-after y esperar
      if (status === 429 && attempt < maxRetries) {
        const retryAfter = (error as any)?.headers?.["retry-after"];
        const waitMs = retryAfter ? (parseInt(retryAfter) + 2) * 1000 : 60_000;
        console.log(`[LLM] Rate limit, esperando ${Math.round(waitMs / 1000)}s (intento ${attempt + 1}/${maxRetries})`);
        await sleep(waitMs);
        continue;
      }

      // Cualquier otro error o último intento → propagar con mensaje claro
      const detail = status ? `[${status}] ` : "";
      throw new Error(`${detail}${msg || "Error desconocido en Claude API"}`);
    }
  }

  throw new Error("No se pudo completar el análisis tras los reintentos");
}

/** Mantiene compatibilidad con el análisis individual (re-analizar un cliente) */
export async function analyzeTranscription(
  transcripcion: string,
  nombre: string,
  id: string
): Promise<AnalysisResult> {
  const results = await analyzeBatch([{ id, nombre, transcripcion }]);
  return results[0];
}
