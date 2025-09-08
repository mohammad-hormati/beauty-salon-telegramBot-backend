/*
  Warnings:

  - You are about to drop the column `date` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Appointment` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Made the column `price` on table `Service` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telegramId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Service" DROP CONSTRAINT "Service_performerId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "date",
DROP COLUMN "status",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Service" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "performerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "telegramId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "public"."Performer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
