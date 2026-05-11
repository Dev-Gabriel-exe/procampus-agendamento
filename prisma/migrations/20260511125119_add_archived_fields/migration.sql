/*
  Warnings:

  - Made the column `subjects` on table `ExamBooking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "isSpecial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specificDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ExamBooking" ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "subjects" SET NOT NULL;

-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ALTER COLUMN "registrationDeadline" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RecoverySchedule" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'normal',
    "period" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'geral',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrationDeadline" TIMESTAMP(3),

    CONSTRAINT "RecoverySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryBooking" (
    "id" TEXT NOT NULL,
    "recoveryScheduleId" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentGrade" TEXT NOT NULL,
    "subjects" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryBooking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecoverySchedule" ADD CONSTRAINT "RecoverySchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryBooking" ADD CONSTRAINT "RecoveryBooking_recoveryScheduleId_fkey" FOREIGN KEY ("recoveryScheduleId") REFERENCES "RecoverySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
