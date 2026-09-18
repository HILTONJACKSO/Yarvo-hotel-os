with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
idx = c.find('Print Receipt')
print(repr(c[idx-100:idx+200]))
