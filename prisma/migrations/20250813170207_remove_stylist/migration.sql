/*
  Warnings:

  - You are about to drop the column `stylistId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the `Stylist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StylistService` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_stylistId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StylistService" DROP CONSTRAINT "StylistService_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StylistService" DROP CONSTRAINT "StylistService_stylistId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "stylistId";

-- DropTable
DROP TABLE "public"."Stylist";

-- DropTable
DROP TABLE "public"."StylistService";
