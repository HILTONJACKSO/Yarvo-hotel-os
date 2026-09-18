import os
import re

path = "apps/web/src/app/dashboard/billing/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

pattern = re.compile(r'(<button onClick=\{\(\) => printViaIframe\(\'RECEIPT\'\)\}[^>]+>Print Receipt</button>)\s*(<button onClick=\{\(\) => printViaIframe\(\'INVOICE\'\)\}[^>]+>Print Invoice</button>)')

def repl(m):
    return m.group(2) + "\n                        " + m.group(1)

c, num = pattern.subn(repl, c)

if num > 0:
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched billing using regex")
else:
    print("Regex failed")
