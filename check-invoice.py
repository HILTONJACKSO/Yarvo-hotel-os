path = "apps/web/src/app/invoice/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re
match = re.search(r"const subtotal = .*?;", c)
if match:
    print(match.group(0))

match2 = re.search(r"const gst = .*?;", c)
if match2:
    print(match2.group(0))
