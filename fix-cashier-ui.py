import sys

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add status badge to card-header
old_header = """                <div className="card-header">
                  <h3>
                    {order.folio?.reservation?.room 
                      ? `Room ${order.folio.reservation.room.number}` 
                      : order.table?.number 
                        ? `Table ${order.table.number}` 
                        : 'Walk-in'}
                  </h3>
                  <span className="amount">${Number(order.totalAmount).toFixed(2)}</span>
                </div>"""

new_header = """                <div className="card-header">
                  <h3>
                    {order.folio?.reservation?.room 
                      ? `Room ${order.folio.reservation.room.number}` 
                      : order.table?.number 
                        ? `Table ${order.table.number}` 
                        : 'Walk-in'}
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="amount">${Number(order.totalAmount).toFixed(2)}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: order.status === 'SERVED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', color: order.status === 'SERVED' ? '#4ade80' : '#facc15' }}>
                      {order.status}
                    </span>
                  </div>
                </div>"""

code = code.replace(old_header, new_header)

# Disable checkout button if not SERVED
old_btn = """              <div className="checkout-actions">
                <button 
                  className="btn-pay" 
                  disabled={isProcessing || payments.reduce((sum, p) => sum + p.amount, 0) < finalTotal - 0.01} 
                  onClick={() => handleCheckout(selectedOrder.id)}
                >"""

new_btn = """              {selectedOrder.status !== 'SERVED' && (
                <div style={{ padding: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#facc15', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                  <strong>Order Not Served:</strong> This order is still being prepared or delivered. It cannot be billed yet.
                </div>
              )}
              <div className="checkout-actions">
                <button 
                  className="btn-pay" 
                  disabled={isProcessing || selectedOrder.status !== 'SERVED' || payments.reduce((sum, p) => sum + p.amount, 0) < finalTotal - 0.01} 
                  onClick={() => handleCheckout(selectedOrder.id)}
                >"""

code = code.replace(old_btn, new_btn)

with open('apps/web/src/app/dashboard/cashier/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
