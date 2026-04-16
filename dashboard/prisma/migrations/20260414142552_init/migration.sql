-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Client_correo_key" ON "Client"("correo");
