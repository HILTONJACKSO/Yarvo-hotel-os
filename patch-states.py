import sys
import re

old_state = """  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const start = d.toISOString().split('T')[0];
    return { start, end };
  });"""

new_state = """  const [dateRange, setDateRange] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { 
      start: start.toISOString().split('T')[0], 
      end: end.toISOString().split('T')[0] 
    };
  });"""

for file_path in ["apps/web/src/app/dashboard/financials/page.tsx", "apps/web/src/app/dashboard/audit-logs/page.tsx", "apps/web/src/app/dashboard/returns/page.tsx"]:
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()
    
    code = code.replace(old_state, new_state)
    
    # Just in case there are subtle whitespace differences
    code = re.sub(
        r'const \[dateRange, setDateRange\] = useState\(\(\) => \{[^}]*return \{ start, end \};\s*\}\);',
        new_state,
        code
    )
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

print("Patched all 3 files")
