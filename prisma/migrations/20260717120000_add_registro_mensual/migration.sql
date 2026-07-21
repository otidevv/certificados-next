-- CreateTable
CREATE TABLE "RegistroMensual" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "regimenLaboral" TEXT,
    "condicion" TEXT,
    "correlativo" TEXT,
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroMensual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroMensual_documentNumber_idx" ON "RegistroMensual"("documentNumber");

-- CreateIndex
CREATE INDEX "RegistroMensual_year_month_idx" ON "RegistroMensual"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroMensual_documentNumber_year_month_key" ON "RegistroMensual"("documentNumber", "year", "month");
