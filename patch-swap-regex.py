import os
import re

path = "apps/web/src/app/dashboard/cashier/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

pattern = re.compile(r'(<button className="btn-secondary" onClick=\{\(\) => handlePrintReceipt\(selectedOrder\.id\)\}>\s*Print Receipt\s*</button>)\s*(<button className="btn-secondary" onClick=\{\(\) => handlePrintInvoice\(selectedOrder\.id\)\}>\s*Print Invoice\s*</button>)')

def repl(m):
    return m.group(2) + "\n              " + m.group(1)

c, num = pattern.subn(repl, c)

if num > 0:
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched using regex")
else:
    print("Regex failed")
