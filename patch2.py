with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
idx = c.find('<span>Subtotal</span>')
print(repr(c[idx-100:idx+500]))
