import os
path = "apps/api/src/modules/analytics/analytics.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

old = "description: d.notes ? `POS Discount - ${d.notes}` : 'POS Discount',"
new = "description: d.discountReason ? `POS Discount - ${d.discountReason}` : 'POS Discount',"

if old in c:
    c = c.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched analytics.service.ts")
else:
    print("Failed to patch analytics.service.ts")
