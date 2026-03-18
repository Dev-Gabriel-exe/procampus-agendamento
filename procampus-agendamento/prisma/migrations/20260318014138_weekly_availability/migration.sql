/*
  Warnings:

  - You are about to drop the column `slotId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the `Slot` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[availabilityId,date,startTime]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `availabilityId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dayOfWeek` to the `Availability` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_slotId_fkey";

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_availabilityId_fkey";

-- DropIndex
DROP INDEX "Appointment_slotId_key";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "slotId",
ADD COLUMN     "availabilityId" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "date",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dayOfWeek" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Slot";

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_availabilityId_date_startTime_key" ON "Appointment"("availabilityId", "date", "startTime");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
