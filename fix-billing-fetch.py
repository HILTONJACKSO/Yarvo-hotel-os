import sys

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace('fetch("/api/v1/bills?status=OPEN")', 'fetch("/api/v1/folios?status=OPEN")')

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
