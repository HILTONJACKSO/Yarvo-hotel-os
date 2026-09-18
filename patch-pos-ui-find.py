with open("apps/web/src/app/dashboard/pos/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
idx = c.find('Discount (%):')
print(repr(c[idx-50:idx+600]))
