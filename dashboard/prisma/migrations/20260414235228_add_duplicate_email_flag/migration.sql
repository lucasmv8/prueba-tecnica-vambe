-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "hasDuplicateEmail" BOOLEAN NOT NULL DEFAULT false,
    "telefono" TEXT NOT NULL,
    "fechaReunion" DATETIME NOT NULL,
    "vendedor" TEXT NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "transcripcion" TEXT NOT NULL,
    "industria" TEXT,
    "tamanioEmpresa" TEXT,
    "volumenMensajes" TEXT,
    "canalDescubrimiento" TEXT,
    "painPoint" TEXT,
    "integraciones" TEXT,
    "objeciones" TEXT,
    "urgencia" TEXT,
    "etapaDecision" TEXT,
    "sentimiento" TEXT,
    "resumenLLM" TEXT,
    "analyzedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("analyzedAt", "canalDescubrimiento", "closed", "correo", "createdAt", "etapaDecision", "fechaReunion", "id", "industria", "integraciones", "nombre", "objeciones", "painPoint", "resumenLLM", "sentimiento", "tamanioEmpresa", "telefono", "transcripcion", "updatedAt", "urgencia", "vendedor", "volumenMensajes") SELECT "analyzedAt", "canalDescubrimiento", "closed", "correo", "createdAt", "etapaDecision", "fechaReunion", "id", "industria", "integraciones", "nombre", "objeciones", "painPoint", "resumenLLM", "sentimiento", "tamanioEmpresa", "telefono", "transcripcion", "updatedAt", "urgencia", "vendedor", "volumenMensajes" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_nombre_correo_key" ON "Client"("nombre", "correo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
