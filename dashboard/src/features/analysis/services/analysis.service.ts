import { prisma } from "@/infrastructure/database/prisma";
import { analyzeBatch, analyzeTranscription } from "./llm.service";
import type { BatchInput } from "../prompts/categorize.prompt";

export interface BatchProgress {
  processed: number;
  total: number;
  currentName?: string;
}

/**
 * Analiza todos los clientes pendientes (analyzedAt = null) o todos si force=true.
 * Envía grupos de 15 clientes en UNA SOLA llamada a la API → ~4 llamadas para 60 clientes.
 * Llama al callback onProgress después de guardar cada cliente en DB.
 */
export async function analyzeAll(
  force: boolean,
  onProgress?: (progress: BatchProgress) => void
): Promise<void> {
  const clients = await (prisma as any).client.findMany({
    where: force ? undefined : { analyzedAt: null },
    select: { id: true, nombre: true, transcripcion: true },
  });

  const total = clients.length;

  if (total === 0) return;

  // Enviar total inmediatamente para que el frontend muestre X/N desde el inicio
  onProgress?.({ processed: 0, total });

  // 15 clientes por llamada → ~4 llamadas para 60 clientes.
  // Haiku tiene 8192 tokens de OUTPUT máximo; 15 clientes × ~400 tokens = ~6000 tokens, seguro.
  const BATCH_SIZE = 15;
  let processed = 0;

  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch: BatchInput[] = clients.slice(i, i + BATCH_SIZE);

    try {
      const results = await analyzeBatch(batch);

      // Guardar todos los resultados del batch en DB
      await Promise.allSettled(
        batch.map(async (client, idx) => {
          try {
            const result = results[idx];
            await (prisma as any).client.update({
              where: { id: client.id },
              data: {
                industria: result.industria,
                tamanioEmpresa: result.tamanioEmpresa,
                volumenMensajes: result.volumenMensajes,
                canalDescubrimiento: result.canalDescubrimiento,
                painPoint: result.painPoint,
                integraciones: result.integraciones,
                objeciones: result.objeciones,
                urgencia: result.urgencia,
                etapaDecision: result.etapaDecision,
                resumenLLM: result.resumenLLM,
                analyzedAt: new Date(),
              },
            });
          } catch (error) {
            console.error(`Error guardando cliente ${client.nombre}:`, error);
          } finally {
            processed++;
            onProgress?.({ processed, total, currentName: client.nombre });
          }
        })
      );
    } catch (error) {
      console.error(`Error en batch ${i}–${i + BATCH_SIZE - 1}:`, error);
      // Marcar todo el batch como procesado para que el progreso avance
      for (const client of batch) {
        processed++;
        onProgress?.({ processed, total, currentName: client.nombre });
      }
    }
  }
}

/**
 * Re-analiza un cliente específico por su ID.
 */
export async function analyzeOne(id: string): Promise<void> {
  const client = await (prisma as any).client.findUnique({
    where: { id },
    select: { id: true, nombre: true, transcripcion: true },
  });

  if (!client) throw new Error(`Cliente con id ${id} no encontrado`);

  const result = await analyzeTranscription(client.transcripcion, client.nombre, client.id);

  await (prisma as any).client.update({
    where: { id },
    data: {
      industria: result.industria,
      tamanioEmpresa: result.tamanioEmpresa,
      volumenMensajes: result.volumenMensajes,
      canalDescubrimiento: result.canalDescubrimiento,
      painPoint: result.painPoint,
      integraciones: result.integraciones,
      objeciones: result.objeciones,
      urgencia: result.urgencia,
      etapaDecision: result.etapaDecision,
      resumenLLM: result.resumenLLM,
      analyzedAt: new Date(),
    },
  });
}

/**
 * Retorna el conteo de clientes sin analizar.
 */
export async function getPendingCount(): Promise<number> {
  return (prisma as any).client.count({
    where: { analyzedAt: null },
  });
}
