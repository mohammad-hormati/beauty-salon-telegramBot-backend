-- CreateEnum
CREATE TYPE "public"."ShiftStatus" AS ENUM ('AVAILABLE', 'OFF', 'LEAVE');

-- CreateTable
CREATE TABLE "public"."Shift" (
    "id" SERIAL NOT NULL,
    "performerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "status" "public"."ShiftStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shift_performerId_date_key" ON "public"."Shift"("performerId", "date");

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "public"."Performer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
