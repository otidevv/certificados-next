-- AlterTable
ALTER TABLE "User" ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "maternalSurname" TEXT,
ADD COLUMN     "paternalSurname" TEXT;

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hours" INTEGER NOT NULL,
    "modality" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "instructor" TEXT NOT NULL,
    "spots" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "paternalSurname" TEXT NOT NULL,
    "maternalSurname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_courseId_documentNumber_key" ON "Enrollment"("courseId", "documentNumber");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
