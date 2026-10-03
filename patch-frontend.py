import re

path = "apps/web/src/app/dashboard/expenses/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Inject useAuth import
if "useAuth" not in c:
    c = c.replace("import { Plus", "import { useAuth } from '@/lib/auth-provider';\nimport { Plus")

# 2. Inject useAuth hook and canDelete variable
if "const { user } = useAuth();" not in c:
    c = c.replace("export default function ExpensesPage() {", "export default function ExpensesPage() {\n  const { user } = useAuth();\n  const canDelete = user?.roles?.some((r: any) => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT'].includes(r?.toUpperCase?.() || r?.name?.toUpperCase?.()));\n")

# 3. Wrap Trash2 with canDelete
c = c.replace("""<button 
                        onClick={() => handleDelete(expense.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>""", """{canDelete && (
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}""")

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Patched frontend")
