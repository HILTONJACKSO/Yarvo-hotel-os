import sys

with open('apps/web/src/app/dashboard/pos/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_card = """                  {servedOrders.map(so => (
                    <div key={so.id} className="served-card" onClick={() => { setSettleOrder(so); setPaymentAmount(String(so.totalAmount)); }}>
                      <div className="sc-header">
                        <span>Order #{so.id.substring(0,8).toUpperCase()}</span>
                        <span className="sc-total">${Number(so.totalAmount).toFixed(2)}</span>
                      </div>"""

new_card = """                  {servedOrders.map(so => (
                    <div key={so.id} className={`served-card ${so.status !== 'SERVED' ? 'opacity-50' : ''}`} onClick={() => { if(so.status === 'SERVED') { setSettleOrder(so); setPaymentAmount(String(so.totalAmount)); } else { showToast('Order is not fully served yet', 'error'); } }}>
                      <div className="sc-header">
                        <span>Order #{so.id.substring(0,8).toUpperCase()}</span>
                        <div className="flex flex-col items-end">
                          <span className="sc-total">${Number(so.totalAmount).toFixed(2)}</span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: so.status === 'SERVED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: so.status === 'SERVED' ? '#4ade80' : '#facc15' }}>
                            {so.status}
                          </span>
                        </div>
                      </div>"""

code = code.replace(old_card, new_card)

with open('apps/web/src/app/dashboard/pos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
