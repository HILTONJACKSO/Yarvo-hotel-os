import re

path = "apps/api/src/modules/pos/pos.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Fix checkoutOrder calculation to ignore RETURNED items
search_str = """    order.items.forEach(i => {
      const itemTotal = Number(i.menuItem.price) * i.quantity;
      subtotal += itemTotal;
      let totalPercentage = 0;"""

replace_str = """    order.items.forEach(i => {
      if (i.status === 'RETURNED' || i.status === 'RETURN_REQUESTED') return;
      const itemTotal = Number(i.menuItem.price) * i.quantity;
      subtotal += itemTotal;
      let totalPercentage = 0;"""

if search_str in c:
    c = c.replace(search_str, replace_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched checkoutOrder in pos.service.ts")
else:
    print("Could not find search_str in pos.service.ts")
