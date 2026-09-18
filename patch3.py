with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

old = """        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Subtotal</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category !== 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>GST / Tax</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category === 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>
        <div style="font-size:14px; font-weight:bold; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Total</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>"""

new = """        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Subtotal</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) / 1.10).toFixed(2)}</span>
        </div>
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>GST / Tax (10%)</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) - (selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) / 1.10)).toFixed(2)}</span>
        </div>
        <div style="font-size:14px; font-weight:bold; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Total</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>"""

if old in c:
    c = c.replace(old, new)
    with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched billing page")
else:
    print("Failed to patch billing page")
