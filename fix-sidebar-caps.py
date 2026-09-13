import sys

with open('apps/web/src/app/dashboard/layout.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('<span className="sidebar-brand">Kwalee</span>', '<span className="sidebar-brand">KWALEE</span>')

with open('apps/web/src/app/dashboard/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
