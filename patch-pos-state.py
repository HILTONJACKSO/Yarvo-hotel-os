import os
import re

page_path = "apps/web/src/app/dashboard/pos/page.tsx"
with open(page_path, "r", encoding="utf-8") as f:
    c = f.read()

# Add state
c = re.sub(
    r"const \[settleDiscountPercent, setSettleDiscountPercent\] = useState<number>\(0\);",
    r"const [settleDiscountPercent, setSettleDiscountPercent] = useState<number>(0);\n    const [settleDiscountReason, setSettleDiscountReason] = useState<string>('');",
    c
)

# Update handleSettle payload
c = re.sub(
    r"if \(settleDiscountAmount > 0\) payload\.discountAmount = settleDiscountAmount;",
    r"if (settleDiscountAmount > 0) { payload.discountAmount = settleDiscountAmount; payload.discountReason = settleDiscountReason || 'POS Discount'; }",
    c
)

# Reset state on success and cancel
c = re.sub(
    r"setSettleDiscountPercent\(0\);",
    r"setSettleDiscountPercent(0); setSettleDiscountReason('');",
    c
)

with open(page_path, "w", encoding="utf-8") as f:
    f.write(c)
print("Patched state in pos/page.tsx")
