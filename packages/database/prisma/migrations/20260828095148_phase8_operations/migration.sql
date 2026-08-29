-- CreateEnum
CREATE TYPE "work_order_type" AS ENUM ('MAINTENANCE', 'HOUSEKEEPING');

-- CreateEnum
CREATE TYPE "work_order_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "work_order_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "work_orders" (
    "id" UUID NOT NULL,
    "roomId" UUID,
    "type" "work_order_type" NOT NULL,
    "status" "work_order_status" NOT NULL DEFAULT 'PENDING',
    "priority" "work_order_priority" NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,
    "reportedById" UUID,
    "assignedToId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_orders_roomId_idx" ON "work_orders"("roomId");

-- CreateIndex
CREATE INDEX "work_orders_status_idx" ON "work_orders"("status");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
