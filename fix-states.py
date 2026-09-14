import sys
import re

# Fix financials
with open("apps/web/src/app/dashboard/financials/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# I will insert the state right after `const [isLoading, setIsLoading] = useState(true);`
state_def = """    const [isLoading, setIsLoading] = useState(true);
    
    const [dateRange, setDateRange] = useState(() => {
      const end = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = d.toISOString().split('T')[0];
      return { start, end };
    });"""

code = re.sub(r'const \[isLoading, setIsLoading\] = useState\(true\);', state_def, code)

with open("apps/web/src/app/dashboard/financials/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)

# Fix audit-logs
with open("apps/web/src/app/dashboard/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Wait, in audit-logs, the TS error says:
# src/app/dashboard/audit-logs/page.tsx(193,42): error TS2304: Cannot find name 'handleDateChange'.
# This means I placed it OUTSIDE the default component function!
# Because I replaced `return (` and it was the WRONG return! It replaced a child component's return!
# Let me look for where I inserted it.

