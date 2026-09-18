import os
path = "apps/web/src/app/invoice/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

old = """const totalCharges = folio.lineItems.filter(i => i.type === 'CHARGE').reduce((acc, curr) => acc + Number(curr.amount), 0);"""
new = """const totalCharges = folio.lineItems.filter(i => i.type === 'CHARGE').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const subtotal = totalCharges / 1.10;
  const gst = totalCharges - subtotal;"""

if old in c:
    c = c.replace(old, new)
    # Now replace the HTML table
    # We want to replace:
    # <tr>
    #   <td>Total Charges:</td>
    #   <td>${totalCharges.toFixed(2)}</td>
    # </tr>
    
    old_table = """<tr>
                  <td>Total Charges:</td>
                  <td>${totalCharges.toFixed(2)}</td>
                </tr>"""
    new_table = """<tr>
                  <td>Subtotal:</td>
                  <td>${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>GST / Tax (10%):</td>
                  <td>${gst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Total Charges:</td>
                  <td style={{ fontWeight: 'bold' }}>${totalCharges.toFixed(2)}</td>
                </tr>"""
    
    if old_table in c:
        c = c.replace(old_table, new_table)
        with open(path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Patched invoice page")
    else:
        print("Failed to find old_table in invoice")
else:
    print("Failed to find old var in invoice")
