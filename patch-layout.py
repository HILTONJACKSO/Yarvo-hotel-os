import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

pattern = r"className=\"p-6 border-t border-slate-700 bg-slate-900/50 flex gap-6\""
replacement = r'className="p-6 border-t border-slate-700 bg-slate-900/50 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"'

new_code = re.sub(pattern, replacement, code)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_code)
