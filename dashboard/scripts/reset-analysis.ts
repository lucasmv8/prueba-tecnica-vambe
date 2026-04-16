/**
 * Resetea analyzedAt de todos los clientes → el próximo inicio del dashboard
 * los re-analizará con la API key vigente.
 *
 * Uso: npm run reset-analysis
 */
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import * as path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const { count } = await (prisma as any).client.updateMany({
    data: { analyzedAt: null },
  });
  console.log(`✓ ${count} clientes marcados como pendientes de análisis.`);
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect());
