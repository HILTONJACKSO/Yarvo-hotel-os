import sys

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_stat = '<div className="stat-value"></div>'
new_stat = '<div className="stat-value">${Number(stats?.totalRevenue || 0).toFixed(2)}</div>'

if old_stat in code:
    code = code.replace(old_stat, new_stat)
    with open('apps/web/src/app/dashboard/cashier/page.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Replaced!")
else:
    print("Not found.")
