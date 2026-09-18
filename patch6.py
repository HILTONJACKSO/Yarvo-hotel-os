path = "apps/web/src/app/invoice/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

import re
old_var = "const totalCharges = folio.lineItems.filter(i => i.type === 'CHARGE').reduce((acc, curr) => acc + Number(curr.amount), 0);"
new_var = """const totalCharges = folio.lineItems.filter(i => i.type === 'CHARGE').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const subtotal = totalCharges / 1.10;
  const gst = totalCharges - subtotal;"""

if old_var in c:
    c = c.replace(old_var, new_var)

pattern = re.compile(r'<tr>\s*<td>Total Charges:</td>\s*<td>\$\{totalCharges\.toFixed\(2\)\}</td>\s*</tr>', re.DOTALL)
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

c, num = pattern.subn(new_table, c)
if num > 0:
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched invoice page")
else:
    print("Failed to patch invoice table")
