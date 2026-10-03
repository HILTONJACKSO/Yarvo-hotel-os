import re

path = "apps/api/src/modules/pos/pos.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Fix the include
search_inc = "include: { orderItem: { include: { order: { include: { items: { include: { menuItem: true } } } } } } }"
replace_inc = "include: { orderItem: { include: { menuItem: { include: { taxes: true } }, order: { include: { items: { include: { menuItem: true } } } } } } }"
c = c.replace(search_inc, replace_inc)

# Fix RESTAURANT_BAR to F_AND_B
c = c.replace("category: 'RESTAURANT_BAR',", "category: 'F_AND_B',")

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Patched errors")
