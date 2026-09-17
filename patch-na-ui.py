import sys

with open("apps/web/src/app/dashboard/night-audit/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add th
code = code.replace('<th className="p-4 font-semibold text-right">F&B Rev</th>', '<th className="p-4 font-semibold text-right">F&B Rev</th>\n                  <th className="p-4 font-semibold text-right">Pool/Tickets</th>\n                  <th className="p-4 font-semibold text-right">Discounts</th>')

# Add td
code = code.replace("""                          <td className="p-4 text-right text-emerald-400 font-medium">
                            ${Number(audit.totalFbRevenue || 0).toFixed(2)}
                          </td>""", """                          <td className="p-4 text-right text-emerald-400 font-medium">
                            ${Number(audit.totalFbRevenue || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-right text-emerald-400 font-medium">
                            ${Number(audit.totalTicketRevenue || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-right text-amber-400 font-medium">
                            ${Number(audit.totalDiscounts || 0).toFixed(2)}
                          </td>""")

with open("apps/web/src/app/dashboard/night-audit/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
