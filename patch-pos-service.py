import os

service_path = "apps/api/src/modules/pos/pos.service.ts"
with open(service_path, "r", encoding="utf-8") as f:
    c = f.read()

import re

# Update createOrder signature
c = re.sub(
    r"async createOrder\(data: \{ tableId\?: string; folioId\?: string; guestId\?: string; userId\?: string; userRoles\?: string\[\]; discountAmount\?: number; notes\?: string \}\) \{",
    r"async createOrder(data: { tableId?: string; folioId?: string; guestId?: string; userId?: string; userRoles?: string[]; discountAmount?: number; discountReason?: string; notes?: string }) {",
    c
)

# Update createOrder updates
c = re.sub(
    r"\.\.\.\(data\.discountAmount \!== undefined \? \{ discountAmount: data\.discountAmount \} : \{\}\),\n\s*\.\.\.\(data\.notes \!== undefined \? \{ notes: data\.notes \} : \{\}\)",
    r"...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),\n                ...(data.discountReason !== undefined ? { discountReason: data.discountReason } : {}),\n                ...(data.notes !== undefined ? { notes: data.notes } : {})",
    c
)

# Update createOrder creation
c = re.sub(
    r"discountAmount: data\.discountAmount \|\| 0,\n\s*notes: data\.notes,",
    r"discountAmount: data.discountAmount || 0,\n          discountReason: data.discountReason,\n          notes: data.notes,",
    c
)

# Update checkoutOrder signature
c = re.sub(
    r"async checkoutOrder\(orderId: string, data: \{ payments\?: \{ method: string; amount: number \}\[\], folioId\?: string, discountAmount\?: number \}\) \{",
    r"async checkoutOrder(orderId: string, data: { payments?: { method: string; amount: number }[], folioId?: string, discountAmount?: number, discountReason?: string }) {",
    c
)

# Replace all instances where checkoutOrder updates posOrder state with discountReason
c = re.sub(
    r"discountAmount: appliedDiscount \}",
    r"discountAmount: appliedDiscount, ...(data.discountReason ? { discountReason: data.discountReason } : {}) }",
    c
)

with open(service_path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched pos.service.ts")
