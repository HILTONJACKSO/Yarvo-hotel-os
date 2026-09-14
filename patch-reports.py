import sys

with open("apps/web/src/app/dashboard/layout.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_reports = "label: 'Reports', href: '/dashboard/reports', id: 'nav-reports', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting', 'cashier', 'front_desk']"
new_reports = "label: 'Reports', href: '/dashboard/reports', id: 'nav-reports', allowedRoles: ['super_admin', 'admin', 'ceo', 'manager', 'accounting']"

code = code.replace(old_reports, new_reports)

with open("apps/web/src/app/dashboard/layout.tsx", "w", encoding="utf-8") as f:
    f.write(code)
