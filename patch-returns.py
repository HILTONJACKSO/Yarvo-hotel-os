import sys

with open("apps/web/src/app/dashboard/returns/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add discounts state
state_old = "  const [returns, setReturns] = useState<PosReturnRequest[]>([]);"
state_new = """  const [returns, setReturns] = useState<PosReturnRequest[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'RETURNS' | 'DISCOUNTS'>('RETURNS');"""
code = code.replace(state_old, state_new)

# Add fetch logic for discounts
fetch_old = """    const query = `?start=${dateRange.start}&end=${dateRange.end}`;
    fetch(`${API_URL}/api/v1/pos/returns${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setReturns(data.data || data))
      .catch(console.error);
  }, [dateRange.start, dateRange.end]);"""

fetch_new = """    const query = `?start=${dateRange.start}&end=${dateRange.end}`;
    fetch(`${API_URL}/api/v1/pos/returns${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setReturns(data.data || data))
      .catch(console.error);

    fetch(`${API_URL}/api/v1/analytics/discounts${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setDiscounts(data.data || []))
      .catch(console.error);
  }, [dateRange.start, dateRange.end]);"""
code = code.replace(fetch_old, fetch_new)

# Update JSX to include tabs and discounts view
jsx_old = """      <div className="returns-grid">
        {returns.length === 0 && <p className="no-data">No return requests found.</p>}"""

jsx_new = """      <div className="flex gap-4 mb-6 border-b border-slate-700">
        <button onClick={() => setActiveTab('RETURNS')} className={`pb-3 px-4 font-bold ${activeTab === 'RETURNS' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Returns</button>
        <button onClick={() => setActiveTab('DISCOUNTS')} className={`pb-3 px-4 font-bold ${activeTab === 'DISCOUNTS' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Discounts</button>
      </div>

      {activeTab === 'RETURNS' && (
        <div className="returns-grid">
          {returns.length === 0 && <p className="no-data">No return requests found.</p>}"""

code = code.replace(jsx_old, jsx_new)

# Close returns grid and add discounts grid
jsx_old_end = """              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}"""

jsx_new_end = """              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {activeTab === 'DISCOUNTS' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
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
              {discounts.map(d => (
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
    </div>
  );
}"""

code = code.replace(jsx_old_end, jsx_new_end)

# Also fix the page title
code = code.replace("<h2>Order Returns Management</h2>", "<h2>Returns & Discounts Dashboard</h2>")
code = code.replace("<p className=\"subtitle\">Track and approve return requests from waitstaff and kitchen/bar.</p>", "<p className=\"subtitle\">Track return requests and monitor applied discounts across Folios and POS orders.</p>")

with open("apps/web/src/app/dashboard/returns/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
