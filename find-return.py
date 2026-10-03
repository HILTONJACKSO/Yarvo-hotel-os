import re
with open("apps/web/src/app/dashboard/inventory/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

m = re.search(r'return\s*\(\s*<div[^>]*>', c)
if m:
    start = m.start()
    print(c[start:start+1000])
else:
    print("Not found")
