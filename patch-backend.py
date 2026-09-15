import sys

with open("apps/api/src/modules/pos/pos.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Fix updateOrderItemStatus loop
old_loop_1 = """          item.order.items.forEach(i => {
            const itemTotal = Number(i.menuItem.price) * i.quantity;"""
new_loop_1 = """          item.order.items.forEach(i => {
            if (i.status === 'RETURNED' || i.status === 'RETURN_REQUESTED') return;
            const itemTotal = Number(i.menuItem.price) * i.quantity;"""
code = code.replace(old_loop_1, new_loop_1)

# Fix checkoutOrder loop
old_loop_2 = """      order.items.forEach(i => {
        const itemTotal = Number(i.menuItem.price) * i.quantity;"""
new_loop_2 = """      order.items.forEach(i => {
        if (i.status === 'RETURNED' || i.status === 'RETURN_REQUESTED') return;
        const itemTotal = Number(i.menuItem.price) * i.quantity;"""
code = code.replace(old_loop_2, new_loop_2)

with open("apps/api/src/modules/pos/pos.service.ts", "w", encoding="utf-8") as f:
    f.write(code)
