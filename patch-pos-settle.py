import sys

with open("apps/web/src/app/dashboard/pos/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add canSettleOrders boolean
old_canEditPos = """  const canEditPos = user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'CEO', 'MANAGER'].includes(role?.toUpperCase?.() || (role as any)?.name?.toUpperCase?.()));"""

new_canEditPos = """  const canEditPos = user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'CEO', 'MANAGER'].includes(role?.toUpperCase?.() || (role as any)?.name?.toUpperCase?.()));
  const canSettleOrders = user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'POS_CASHIER'].includes(role?.toUpperCase?.() || (role as any)?.name?.toUpperCase?.()));"""

code = code.replace(old_canEditPos, new_canEditPos)

# Protect Settle Orders button
old_button = """              <div className="flex gap-2">
                <button className="btn-success btn-sm" onClick={() => {fetchData(); setShowSettleModal(true);}}>Settle Orders ({servedOrders.length})</button>"""

new_button = """              <div className="flex gap-2">
                {canSettleOrders && <button className="btn-success btn-sm" onClick={() => {fetchData(); setShowSettleModal(true);}}>Settle Orders ({servedOrders.length})</button>}"""

code = code.replace(old_button, new_button)


with open("apps/web/src/app/dashboard/pos/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
