import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

pattern = r"(export default function BillingPage\(\) \{)"
replacement = r"\1\n  const [discountAmount, setDiscountAmount] = useState('');\n  const [discountDescription, setDiscountDescription] = useState('');\n  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);"

new_code = re.sub(pattern, replacement, code)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_code)
