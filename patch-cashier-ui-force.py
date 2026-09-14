import sys

with open("apps/web/src/app/dashboard/cashier/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# I will use a regex or split to replace the coming-soon-grid content
start_marker = '<div className="coming-soon-grid" style={{ marginBottom: \'28px\' }}>'
end_marker = '<h2>POS Cashier</h2>'

if start_marker in code and end_marker in code:
    before = code.split(start_marker)[0]
    after = code.split(end_marker)[1]
    
    new_grid = """<div className="coming-soon-grid" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215, 20%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div className="stat-value">${Number(stats?.totalRevenue || 0).toFixed(2)}</div>
            <div className="stat-title">Total Revenue</div>
            <div className="stat-desc">Settled today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215, 20%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
            <div className="stat-value">{stats?.totalOrders || 0}</div>
            <div className="stat-title">Total Orders Paid</div>
            <div className="stat-desc">Orders settled today</div>
          </div>
          <div className="stat-card cursor-pointer hover:border-yellow-500 transition-colors" style={{ border: '1px solid hsl(43, 96%, 56%)' }} onClick={() => setIsTransferModalOpen(true)}>
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(43, 96%, 56%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v18"/><path d="m10 18 7 3 7-3"/><path d="M7 21V3"/><path d="m14 6-7-3-7 3"/></svg></div>
            <div className="stat-value" style={{ color: 'hsl(43, 96%, 56%)' }}>Transfer Items</div>
            <div className="stat-title">Between Tables/Orders</div>
            <div className="stat-desc">Move items from one table to another</div>
          </div>
        </div>
        
        """
        
    code = before + new_grid + end_marker + after
    with open("apps/web/src/app/dashboard/cashier/page.tsx", "w", encoding="utf-8") as f:
        f.write(code)
    print("SUCCESS: UI Updated!")
else:
    print("ERROR: Markers not found!")
