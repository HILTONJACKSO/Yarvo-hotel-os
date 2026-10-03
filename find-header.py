with open("apps/web/src/app/dashboard/inventory/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()
idx = c.find('page-header')
print(c[max(0, idx-200):idx+500])
