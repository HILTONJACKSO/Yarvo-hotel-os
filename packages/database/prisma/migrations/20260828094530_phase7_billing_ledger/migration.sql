-- CreateEnum
CREATE TYPE "line_item_type" AS ENUM ('CHARGE', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "line_item_category" AS ENUM ('ROOM', 'F_AND_B', 'LAUNDRY', 'SPA', 'TAX', 'PAYMENT_CASH', 'PAYMENT_CARD', 'PAYMENT_BANK', 'OTHER');

-- CreateTable
CREATE TABLE "folio_line_items" (
    "id" UUID NOT NULL,
    "folioId" UUID NOT NULL,
    "type" "line_item_type" NOT NULL,
    "category" "line_item_category" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "referenceCode" VARCHAR(100),
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "folio_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folio_line_items_folioId_idx" ON "folio_line_items"("folioId");

-- CreateIndex
CREATE INDEX "folio_line_items_type_idx" ON "folio_line_items"("type");

-- CreateIndex
CREATE INDEX "folio_line_items_category_idx" ON "folio_line_items"("category");

-- AddForeignKey
ALTER TABLE "folio_line_items" ADD CONSTRAINT "folio_line_items_folioId_fkey" FOREIGN KEY ("folioId") REFERENCES "folios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
