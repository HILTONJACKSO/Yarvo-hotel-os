import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

pattern = r"(<button onClick=\{\(\) => printViaIframe\('RECEIPT'\)\} className=[^>]+>Print Receipt</button>)"

replacement = """{selectedBill.status === 'OPEN' && Number(selectedBill.balance) === 0 && (
                          <button onClick={handleCloseFolio} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Close Folio</button>
                        )}
                        \\1"""

new_code = re.sub(pattern, replacement, code)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_code)
