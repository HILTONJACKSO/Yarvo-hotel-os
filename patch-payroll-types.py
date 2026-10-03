path = "apps/web/src/components/staff/PayrollTab.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

search_str = "export function PayrollTab({ staff }: { staff: any[] }) {"
replace_str = "export function PayrollTab({ staff, isManager }: { staff: any[], isManager?: boolean }) {"

if search_str in c:
    c = c.replace(search_str, replace_str)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched PayrollTab.tsx types")
else:
    print("Could not find search_str in PayrollTab.tsx")
