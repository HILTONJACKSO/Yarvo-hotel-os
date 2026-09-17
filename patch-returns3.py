import sys

with open("apps/web/src/app/dashboard/returns/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_str = """        ))}
      </div>

      <style>{`"""

new_str = """        ))}
      </div>
      )}

      {activeTab === 'DISCOUNTS' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Reference (Guest/Table)</th>
                <th className="p-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {discounts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No discounts found for this period.</td></tr>
              )}
              {discounts.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-800/50">
                  <td className="p-4">{new Date(d.date).toLocaleString()}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${d.source === 'FOLIO' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{d.source}</span></td>
                  <td className="p-4">{d.description}</td>
                  <td className="p-4">{d.reference}</td>
                  <td className="p-4 text-right font-bold text-amber-400">${Number(d.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`"""

code = code.replace(old_str, new_str)

with open("apps/web/src/app/dashboard/returns/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
