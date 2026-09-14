import sys

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_use_effect = """  useEffect(() => {
    if (selectedOrder) {
      setPayments([]);
        setDiscountValue('');
        setDiscountType('PERCENT');
        setPaymentAmount(selectedOrder.totalAmount);
      setPaymentMethod('PAYMENT_CASH');
    }
  }, [selectedOrder]);"""

new_use_effect = """  useEffect(() => {
    if (selectedOrder) {
      setPayments([]);
        setDiscountValue('');
        setDiscountType('PERCENT');
        setPaymentAmount(selectedOrder.totalAmount);
      setPaymentMethod('PAYMENT_CASH');
    }
  }, [selectedOrder?.id]);"""

code = code.replace(old_use_effect, new_use_effect)

with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
