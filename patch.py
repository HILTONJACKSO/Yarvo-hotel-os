import re

target_file = "apps/web/src/app/dashboard/billing/page.tsx"

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

def repl(m):
    return """          <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>Subtotal</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) / 1.10).toFixed(2)}</span>
          </div>
          <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>GST / Tax</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) - (selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0) / 1.10)).toFixed(2)}</span>
          </div>
          <div style="font-size:14px; font-weight:bold; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
            <span>Total</span><span>$${(selectedBill.lineItems.filter((i:any) => i.type === 'CHARGE').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0)).toFixed(2)}</span>
          </div>"""

# Match the three divs using a regex
pattern = re.compile(r'<div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">\s*<span>Subtotal</span>.*?<span>Total</span>.*?</script>|</div>', re.DOTALL)
# wait, writing a precise regex is safer. Let's match from Subtotal to the end of Total div.
pattern = re.compile(r'<div[^>]*>\s*<span>Subtotal</span>.*?<span>Total</span>.*?</div>\s*</div>', re.DOTALL)

# Let's write a simple script that replaces between `<!-- SUB_START -->` and `<!-- SUB_END -->`... wait I didn't add comments.

import sys

# find the exact string
start_idx = content.find('<span>Subtotal</span>')
if start_idx != -1:
    # go back to the `<div`
    div_start = content.rfind('<div', 0, start_idx)
    
    # find `<span>Total</span>`
    total_idx = content.find('<span>Total</span>', start_idx)
    # find the closing div of Total's div
    # it's </div>
    total_end = content.find('</div>', total_idx)
    total_end = content.find('</div>', total_end + 1) # one for the inner, one for the outer, wait no it's `</div>` on next line.
    
    
    # It's better to just do this:
    print("Found Subtotal at", start_idx)
else:
    print("Not found")

