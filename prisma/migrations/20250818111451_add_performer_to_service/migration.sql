/*
  Warnings:

  - Added the required column `performerId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Service" ADD COLUMN     "performerId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."Performer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Performer_name_key" ON "public"."Performer"("name");

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "public"."Performer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
