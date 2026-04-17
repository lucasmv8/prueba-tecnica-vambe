import { prisma } from "@vambe/database";
import { analyzeBatch, analyzeTranscription } from "./llm.service";
import type { BatchInput } from "./prompts/categorize.prompt";

export interface BatchProgress {
  processed: number;
  total: number;
  currentName?: string;
}

export async function analyzeAll(
  force: boolean,
  onProgress?: (progress: BatchProgress) => void
): Promise<void> {
  const clients = await prisma.client.findMany({
    where: force ? undefined : { analysis: null },
    select: { id: true, nombre: true, transcripcion: true },
  });

  const total = clients.length;
  if (total === 0) return;

  onProgress?.({ processed: 0, total });

  const BATCH_SIZE = 15;
  let processed = 0;

  for (let i = 0; i < clients.length; i += BATCH_SIZE) {
    const batch: BatchInput[] = clients.slice(i, i + BATCH_SIZE);

    try {
      const results = await analyzeBatch(batch);

      await Promise.allSettled(
        batch.map(async (client, idx) => {
          try {
            const result = results[idx];
            await prisma.clientAnalysis.upsert({
              where: { clientId: client.id },
              create: {
                clientId: client.id,
                industria: result.industria,
                volumenMensajes: result.volumenMensajes,
                canalDescubrimiento: result.canalDescubrimiento,
                painPoint: result.painPoint,
                integraciones: result.integraciones,
                potencial: result.potencial,
                conclusionEjecutiva: result.conclusionEjecutiva,
                proximaAccion: result.proximaAccion,
              },
              update: {
                industria: result.industria,
                volumenMensajes: result.volumenMensajes,
                canalDescubrimiento: result.canalDescubrimiento,
                painPoint: result.painPoint,
                integraciones: result.integraciones,
                potencial: result.potencial,
                conclusionEjecutiva: result.conclusionEjecutiva,
                proximaAccion: result.proximaAccion,
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
      for (const client of batch) {
        processed++;
        onProgress?.({ processed, total, currentName: client.nombre });
      }
    }
  }
}

export async function analyzeOne(id: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id },
    select: { id: true, nombre: true, transcripcion: true },
  });

  if (!client) throw new Error(`Cliente con id ${id} no encontrado`);

  const result = await analyzeTranscription(client.transcripcion, client.nombre, client.id);

  await prisma.clientAnalysis.upsert({
    where: { clientId: id },
    create: {
      clientId: id,
      industria: result.industria,
      volumenMensajes: result.volumenMensajes,
      canalDescubrimiento: result.canalDescubrimiento,
      painPoint: result.painPoint,
      integraciones: result.integraciones,
      potencial: result.potencial,
      conclusionEjecutiva: result.conclusionEjecutiva,
      proximaAccion: result.proximaAccion,
    },
    update: {
      industria: result.industria,
      volumenMensajes: result.volumenMensajes,
      canalDescubrimiento: result.canalDescubrimiento,
      painPoint: result.painPoint,
      integraciones: result.integraciones,
      potencial: result.potencial,
      conclusionEjecutiva: result.conclusionEjecutiva,
      proximaAccion: result.proximaAccion,
      analyzedAt: new Date(),
    },
  });
}

export async function getPendingCount(): Promise<number> {
  return prisma.client.count({
    where: { analysis: null },
  });
}
