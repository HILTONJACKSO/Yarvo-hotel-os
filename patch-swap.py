import os

path = "apps/web/src/app/dashboard/cashier/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

old = """              <div className="payment-actions">
                <button className="btn-secondary" onClick={() => handlePrintReceipt(selectedOrder.id)}>
                  Print Receipt
                </button>
                <button className="btn-secondary" onClick={() => handlePrintInvoice(selectedOrder.id)}>
                  Print Invoice
                </button>
                <button """

new = """              <div className="payment-actions">
                <button className="btn-secondary" onClick={() => handlePrintInvoice(selectedOrder.id)}>
                  Print Invoice
                </button>
                <button className="btn-secondary" onClick={() => handlePrintReceipt(selectedOrder.id)}>
                  Print Receipt
                </button>
                <button """

if old in c:
    c = c.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched cashier/page.tsx")
else:
    print("Failed to patch cashier/page.tsx")
