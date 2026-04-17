/**
 * Resetea analyzedAt de todos los clientes → el próximo inicio del dashboard
 * los re-analizará con la API key vigente.
 *
 * Uso: pnpm reset-analysis (desde la raíz del monorepo)
 */
import { PrismaClient } from "../packages/database/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida en .env.local");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const { count } = await prisma.clientAnalysis.deleteMany({});
  console.log(`✓ ${count} análisis eliminados. Los clientes serán re-analizados en el próximo inicio.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
