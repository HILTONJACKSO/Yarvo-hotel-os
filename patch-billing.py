import sys
import re

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Change all user-facing "Folio" strings to "Bill", except internal states
code = code.replace("Folio Invoice", "Bill Invoice")
code = code.replace("Folio:", "Bill:")
code = code.replace("Folio Header", "Bill Header")
code = code.replace("Close Folio", "Close Bill")
code = code.replace("folios?", "bills?")
code = code.replace("folio?", "bill?")
code = code.replace(">Folio<", ">Bill<")

# Now update the print html
def replace_print(match):
    html = match.group(0)
    
    # Signature block fix
    sig_old = """        <div style="margin-top:50px; text-align:center;">
          <div style="border-top:1px solid #000; width:200px; margin:0 auto 8px auto;"></div>
          <p style="font-size:12px; margin:0; color:#000;">Guest Signature</p>
        </div>"""
        
    sig_new = """        ${mode === 'INVOICE' ? `
        <div style="margin-top:50px; text-align:center;">
          <div style="border-top:1px solid #000; width:200px; margin:0 auto 8px auto;"></div>
          <p style="font-size:12px; margin:0; color:#000;">Guest Signature</p>
        </div>
        ` : ''}"""
    html = html.replace(sig_old, sig_new)
    
    return html

# We also need to add Subtotal, GST, Total to the HTML
old_total_html = """        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        ${itemsHtml}
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:18px; font-weight:bold; display:flex; justify-content:space-between; margin-top:12px; color:#000;">
          <span>BALANCE DUE</span><span>$${Number(selectedBill.balance).toFixed(2)}</span>
        </div>"""

new_total_html = """        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        ${itemsHtml}
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Subtotal</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category !== 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>GST / Tax</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category === 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>
        <div style="font-size:14px; font-weight:bold; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Total Charges</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
        </div>
        
        <div style="font-size:18px; font-weight:bold; display:flex; justify-content:space-between; margin-top:12px; color:#000;">
          <span>BALANCE DUE</span><span>$${Number(selectedBill.balance).toFixed(2)}</span>
        </div>"""

code = code.replace(old_total_html, new_total_html)
code = code.replace(sig_old, sig_new) # Use the same variables just to be safe

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
