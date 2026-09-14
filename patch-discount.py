import sys

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_logic = """  const calculatedDiscount = selectedOrder 
    ? (discountType === 'PERCENT' ? (Number(selectedOrder.totalAmount) * (Number(discountValue || 0) / 100)) : Number(discountValue || 0))
    : 0;"""

new_logic = """  const calculatedDiscount = selectedOrder 
    ? ((selectedOrder.status === 'PAID' || selectedOrder.status === 'BILLED_TO_ROOM')
        ? Number(selectedOrder.discountAmount || 0)
        : (discountType === 'PERCENT' ? (Number(selectedOrder.totalAmount) * (Number(discountValue || 0) / 100)) : Number(discountValue || 0)))
    : 0;"""

code = code.replace(old_logic, new_logic)

with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
