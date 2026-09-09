ALTER TABLE "pos_orders" ADD COLUMN IF NOT EXISTS "receiptPrintCount" INT DEFAULT 0;
ALTER TABLE "pos_orders" ADD COLUMN IF NOT EXISTS "invoicePrintCount" INT DEFAULT 0;
UPDATE "pos_orders" o SET "totalAmount" = (SELECT COALESCE(SUM(mi.price * poi.quantity), 0) FROM "pos_order_items" poi JOIN "pos_menu_items" mi ON poi."menuItemId" = mi.id WHERE poi."orderId" = o.id AND poi.status NOT IN ('RETURNED', 'RETURN_REQUESTED')) - COALESCE(o."discountAmount", 0) WHERE o.status NOT IN ('PAID', 'BILLED_TO_ROOM');
UPDATE "pos_orders" SET "totalAmount" = 0 WHERE "totalAmount" < 0;