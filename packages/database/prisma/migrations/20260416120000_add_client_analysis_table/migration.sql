-- Drop LLM columns from Client (moved to ClientAnalysis)
ALTER TABLE "Client"
  DROP COLUMN IF EXISTS "industria",
  DROP COLUMN IF EXISTS "tamanioEmpresa",
  DROP COLUMN IF EXISTS "volumenMensajes",
  DROP COLUMN IF EXISTS "canalDescubrimiento",
  DROP COLUMN IF EXISTS "painPoint",
  DROP COLUMN IF EXISTS "integraciones",
  DROP COLUMN IF EXISTS "objeciones",
  DROP COLUMN IF EXISTS "urgencia",
  DROP COLUMN IF EXISTS "etapaDecision",
  DROP COLUMN IF EXISTS "resumenLLM",
  DROP COLUMN IF EXISTS "analyzedAt";

-- Create ClientAnalysis table
CREATE TABLE "ClientAnalysis" (
  "id"                  TEXT NOT NULL,
  "clientId"            TEXT NOT NULL,
  "analyzedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "industria"           TEXT NOT NULL,
  "volumenMensajes"     TEXT NOT NULL,
  "canalDescubrimiento" TEXT NOT NULL,
  "painPoint"           TEXT NOT NULL,
  "integraciones"       TEXT NOT NULL,
  "potencial"           TEXT NOT NULL,
  "conclusionEjecutiva" TEXT NOT NULL,
  "proximaAccion"       TEXT NOT NULL,
  CONSTRAINT "ClientAnalysis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientAnalysis_clientId_key" UNIQUE ("clientId"),
  CONSTRAINT "ClientAnalysis_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
