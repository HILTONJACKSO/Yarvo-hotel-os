import sys

with open("apps/web/src/app/invoice/[id]/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add Subtotal, GST
old_table = """            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Total Charges:</td>
                  <td>${totalCharges.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Payments:</td>
                  <td>${totalPayments.toFixed(2)}</td>
                </tr>
                <tr className="balance-row">
                  <td>Balance Due:</td>
                  <td>${Number(folio.balance).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>"""

new_table = """            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td>${folio.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category !== 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>GST / Tax:</td>
                  <td>${folio.lineItems.filter((i:any) => i.type === 'CHARGE' && i.category === 'TAX').reduce((acc:number, curr:any) => acc + Number(curr.amount), 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total:</td>
                  <td>${totalCharges.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Total Payments:</td>
                  <td>${totalPayments.toFixed(2)}</td>
                </tr>
                <tr className="balance-row">
                  <td>Balance Due:</td>
                  <td>${Number(folio.balance).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>"""

code = code.replace(old_table, new_table)
code = code.replace("Folio Invoice", "Bill Invoice")
code = code.replace("Folio Details", "Bill Details")

with open("apps/web/src/app/invoice/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
