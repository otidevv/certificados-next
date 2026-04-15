-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "dependenciaId" TEXT;

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependencia" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sede_name_key" ON "Sede"("name");

-- CreateIndex
CREATE INDEX "Dependencia_sedeId_idx" ON "Dependencia"("sedeId");

-- CreateIndex
CREATE INDEX "Course_dependenciaId_idx" ON "Course"("dependenciaId");

-- AddForeignKey
ALTER TABLE "Dependencia" ADD CONSTRAINT "Dependencia_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
