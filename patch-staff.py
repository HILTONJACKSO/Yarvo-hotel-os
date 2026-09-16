import sys

with open("apps/web/src/app/dashboard/staff/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_isManager = "const isManager = user?.roles?.some((r: string) => ['super_admin', 'admin', 'ceo', 'manager'].includes(r));"
new_isManager = "const isManager = user?.roles?.some((r: string) => ['super_admin', 'admin', 'ceo', 'manager'].includes(r.toLowerCase()));"
code = code.replace(old_isManager, new_isManager)

with open("apps/web/src/app/dashboard/staff/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
