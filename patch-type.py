import sys

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_type = """type PosOrder = {
  id: string;
  totalAmount: string;
  status: string;"""

new_type = """type PosOrder = {
  id: string;
  totalAmount: string;
  discountAmount?: number | string;
  status: string;"""

code = code.replace(old_type, new_type)

with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
