import os

target_file = "apps/web/src/app/dashboard/billing/page.tsx"

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """          <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>Subtotal</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category !== 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
          </div>
          <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>GST / Tax</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category === 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
          </div>
          <div style="font-size:14px; font-weight:bold; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>Total</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
          </div>"""

new_block = """          <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>Subtotal</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) / 1.10).toFixed(2)}</span>
          </div>
          <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>GST (10%)</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) - (selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) / 1.10)).toFixed(2)}</span>
          </div>
          <div style="font-size:14px; font-weight:bold; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>Total</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
          </div>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated billing/page.tsx")
else:
    print("Could not find old_block in billing/page.tsx")
