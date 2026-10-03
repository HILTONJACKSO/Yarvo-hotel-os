import re

path = "apps/api/src/modules/expenses/expenses.controller.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Replace roles for Delete
c = re.sub(r"@Roles\('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER'\)\s+async remove\(", 
           "@Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')\n  async remove(", c)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Patched backend")
