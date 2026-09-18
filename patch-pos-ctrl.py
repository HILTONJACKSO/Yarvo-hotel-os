import os

controller_path = "apps/api/src/modules/pos/pos.controller.ts"
with open(controller_path, "r", encoding="utf-8") as f:
    c = f.read()

old = "checkoutOrder(@Param('id') id: string, @Body() data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number }) {"
new = "checkoutOrder(@Param('id') id: string, @Body() data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number, discountReason?: string }) {"

if old in c:
    c = c.replace(old, new)
    with open(controller_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched pos.controller.ts")
else:
    print("Failed to patch pos.controller.ts")
