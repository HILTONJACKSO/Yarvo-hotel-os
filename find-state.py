import re
with open("apps/web/src/app/dashboard/inventory/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

m = re.search(r'const \[searchQuery', c)
if m:
    start = m.start()
    print(c[start-500:start+200])
