import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import { config } from "dotenv";

config({ path: ".env.local" });

interface CSVRow {
  Nombre: string;
  "Correo Electronico": string;
  "Numero de Telefono": string;
  "Fecha de la Reunion": string;
  "Vendedor asignado": string;
  closed: string;
  Transcripcion: string;
}

async function main() {
  const dbPath = path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter } as never);

  const csvPath = path.join(process.cwd(), "data", "vambe_clients.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  const { data } = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  // Detectar emails duplicados ANTES de insertar
  const emailCount = new Map<string, number>();
  for (const row of data) {
    const correo = row["Correo Electronico"]?.trim();
    if (correo) emailCount.set(correo, (emailCount.get(correo) ?? 0) + 1);
  }
  const duplicateEmails = new Set(
    [...emailCount.entries()].filter(([, count]) => count > 1).map(([email]) => email)
  );

  if (duplicateEmails.size > 0) {
    console.log(`⚠️  Emails duplicados detectados en el CSV:`);
    for (const email of duplicateEmails) {
      const nombres = data
        .filter((r) => r["Correo Electronico"]?.trim() === email)
        .map((r) => r.Nombre?.trim());
      console.log(`   ${email} → ${nombres.join(", ")}`);
    }
  }

  console.log(`\n📦 Importando ${data.length} clientes...`);

  let created = 0;
  let updated = 0;

  for (const row of data) {
    const correo = row["Correo Electronico"]?.trim();
    const nombre = row.Nombre?.trim() ?? "";
    if (!correo) continue;

    const hasDuplicateEmail = duplicateEmails.has(correo);

    await (prisma as any).client.upsert({
      where: { nombre_correo: { nombre, correo } },
      update: { hasDuplicateEmail },
      create: {
        nombre,
        correo,
        telefono: row["Numero de Telefono"]?.trim() ?? "",
        fechaReunion: new Date(row["Fecha de la Reunion"]?.trim()),
        vendedor: row["Vendedor asignado"]?.trim() ?? "",
        closed: row.closed?.trim() === "1",
        transcripcion: row.Transcripcion?.trim() ?? "",
        hasDuplicateEmail,
      },
    });

    // Contar si fue create o update (aproximado)
    created++;
  }

  console.log(`✅ ${created} clientes procesados (${duplicateEmails.size > 0 ? `${[...duplicateEmails].reduce((acc, e) => acc + emailCount.get(e)!, 0)} marcados con email duplicado` : "sin duplicados"}).`);
  await (prisma as any).$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
