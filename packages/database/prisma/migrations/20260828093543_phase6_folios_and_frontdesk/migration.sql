-- CreateEnum
CREATE TYPE "folio_status" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "folios" (
    "id" UUID NOT NULL,
    "reservationId" UUID NOT NULL,
    "status" "folio_status" NOT NULL DEFAULT 'OPEN',
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "folios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folios_reservationId_key" ON "folios"("reservationId");

-- AddForeignKey
ALTER TABLE "folios" ADD CONSTRAINT "folios_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
