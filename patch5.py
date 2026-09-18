path = "apps/web/src/app/invoice/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()
idx = c.find('Total Charges:')
print(repr(c[idx-50:idx+100]))
