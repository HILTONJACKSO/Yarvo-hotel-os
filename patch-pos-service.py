import sys
import re

with open("apps/api/src/modules/pos/pos.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Fix 1: updateOrderItemStatus allServed logic
old_allServed = "const allServed = item.order.items.every(i => i.status === 'SERVED');"
new_allServed = "const allServed = item.order.items.every(i => ['SERVED', 'RETURNED'].includes(i.status));"
code = code.replace(old_allServed, new_allServed)

# Fix 2: checkoutOrder enforcement logic
old_checkout = """    // Enforce workflow: cashier can only settle SERVED orders (kitchen/bar done + waitstaff delivered)
    if (order.status !== 'SERVED') {
      throw new ForbiddenException(
        'Order cannot be settled yet. All items must be marked ready by the kitchen/bar, and delivered by the waitstaff first.'
      );
    }"""
new_checkout = """    // Enforce workflow: cashier can only settle orders where all active items are SERVED
    const hasUnserved = order.items.some(i => !['SERVED', 'RETURNED'].includes(i.status));
    if (hasUnserved) {
      throw new ForbiddenException(
        'Order cannot be settled yet. All items must be marked ready by the kitchen/bar, and delivered by the waitstaff first.'
      );
    }"""
code = code.replace(old_checkout, new_checkout)

with open("apps/api/src/modules/pos/pos.service.ts", "w", encoding="utf-8") as f:
    f.write(code)
