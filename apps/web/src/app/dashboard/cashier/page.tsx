'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PosOrder = {
  id: string;
  totalAmount: string;
  status: string;
  table?: { number: string };
  folio?: {
    reservation: {
      room?: { number: string };
      guest?: { firstName: string; lastName: string };
    }
  };
  guest?: { firstName: string; lastName: string; companyName?: string; phone?: string };
  invoicePrintCount: number;
  user?: { firstName: string; lastName: string };
  items: Array<{
    id: string;
    quantity: number;
    status?: string;
    menuItem: { name: string; price: string };
  }>;
};

export default function CashierPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [printMode, setPrintMode] = useState<'RECEIPT' | 'INVOICE'>('RECEIPT');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/users/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCurrentUser(data.data || data))
      .catch(() => {});
  }, []);

  // Split payment state
  const [payments, setPayments] = useState<Array<{method: string; amount: number}>>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAYMENT_CASH');

  useEffect(() => {
    if (selectedOrder) {
      setPayments([]);
      setPaymentAmount(selectedOrder.totalAmount);
      setPaymentMethod('PAYMENT_CASH');
    }
  }, [selectedOrder]);

  const handleAddPayment = () => {
    if (!selectedOrder) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    const currentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = Number(selectedOrder.totalAmount);
    if (currentTotal + amt > orderTotal + 0.01) {
      showToast('Payment amount exceeds remaining balance', 'error');
      return;
    }
    setPayments([...payments, { method: paymentMethod, amount: amt }]);
    
    // Auto-update amount to remaining
    const remaining = orderTotal - (currentTotal + amt);
    setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const removePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
    
    if (selectedOrder) {
      const currentTotal = newPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = Number(selectedOrder.totalAmount) - currentTotal;
      setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
    }
  };

  const fetchOrders = () => {
    fetch(`${API_URL}/api/v1/pos/served-orders`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const result = data.data || data;
        setOrders(Array.isArray(result) ? result : []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

    const printViaIframe = (mode: 'RECEIPT' | 'INVOICE') => {
    if (!selectedOrder) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    let itemsHtml = '';
    selectedOrder.items.forEach((item: any) => {
      const isReturned = item.status === 'RETURNED';
      const displayName = isReturned ? `(Returned) ${item.menuItem.name}` : item.menuItem.name;
      const displayPrice = isReturned 
          ? `-$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`
          : `$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`;
          
      itemsHtml += `
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; ${isReturned ? 'color: #dc2626;' : ''}">
          <div><span style="margin-right: 8px;">${item.quantity}x</span><span>${displayName}</span></div>
          <span>${displayPrice}</span>
        </div>
      `;
    });

    const signatureBlock = mode === 'INVOICE' ? `
      <div style="margin-top: 50px; text-align: center;">
        <div style="border-top: 1px solid #000; width: 200px; margin: 0 auto 8px auto;"></div>
        <p style="font-size: 12px; margin: 0;">Customer Signature</p>
      </div>
    ` : '';

    const orderTotal = Number(selectedOrder.totalAmount);
    // Assuming 10% GST included in the price for display purposes
    const subtotal = orderTotal / 1.10;
    const gst = orderTotal - subtotal;

    doc.write(`
      <html>
        <head>
          <title>Print ${mode}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; max-width: 380px; margin: 0 auto; padding: 20px; }
            .header-container { text-align: left; margin-bottom: 20px; }
            .header-container img { max-width: 120px; margin-bottom: 10px; }
            .header-title { font-size: 20px; font-weight: bold; margin: 0 0 4px 0; }
            .header-info { font-size: 12px; margin: 0; line-height: 1.4; }
            
            p.sub { text-align: center; font-size: 14px; font-weight: bold; margin: 20px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; opacity: 0.4; }
            .meta { font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; }
            .meta span:first-child { color: #666; }
            
            .summary-row { font-size: 14px; display: flex; justify-content: space-between; margin-top: 8px; }
            .totals { font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 12px; }
            
            .footer { text-align: center; font-size: 11px; margin-top: 40px; color: #333; line-height: 1.5; }
            .footer-terms { text-align: left; font-size: 10px; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; color: #555; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <img src="/kwalee-logo.png" alt="Logo" />
            <div class="header-title">KWAALEE BEACH RESORT</div>
            <div class="header-info">www.kwaleebeachresort.com</div>
            <div class="header-info">+231 774 340 843 / +231 881 774 350</div>
            <div class="header-info">Kpakpa Kon, Marshall, Lower Margibi County, Liberia</div>
          </div>
          
          <div class="divider"></div>
          <p class="sub">${mode === 'INVOICE' ? 'CUSTOMER INVOICE' : 'CUSTOMER RECEIPT'}</p>
          
          <div class="meta"><span>ORDER ID</span> <span>#${selectedOrder.id.substring(0,8).toUpperCase()}</span></div>
          <div class="meta"><span>LOCATION</span> <span>${selectedOrder.folio?.reservation?.room ? `Room ${selectedOrder.folio.reservation.room.number}` : selectedOrder.table?.number || 'Walk-in'}</span></div>
          <div class="meta"><span>DATE</span> <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
          
          <div class="divider"></div>
          
          ${itemsHtml}
          
          <div class="divider"></div>
          
          <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="summary-row"><span>GST (10%)</span><span>$${gst.toFixed(2)}</span></div>
          <div class="totals"><span>TOTAL</span><span>$${orderTotal.toFixed(2)}</span></div>
          
          ${signatureBlock}

          <div class="footer">
            <p><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
            <p>Served by: ${selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'Staff'}</p>
          </div>
          
          <div class="footer-terms">
            <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
            Payment is due immediately upon receipt of this invoice unless otherwise agreed. All prices are subject to applicable charges. Any additional orders or services will be added to the final bill.
            <br/><br/>
            Thank you for choosing Kwalee Beach Restaurant.
          </div>
        </body>
      </html>
    `);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 250);
  };

  const handlePrintInvoice = async (orderId: string) => {
    if (!selectedOrder) return;
    const isStaff = currentUser?.roles?.includes('WAITSTAFF') || currentUser?.roles?.includes('CASHIER') || currentUser?.roles?.includes('BAR') || currentUser?.roles?.includes('KITCHEN');
    const isManager = currentUser?.roles?.includes('MANAGER');
    
    if (isStaff && selectedOrder.invoicePrintCount >= 1) {
      showToast('Staff can only print an invoice once. Please contact management.', 'error');
      return;
    }
    if (isManager && selectedOrder.invoicePrintCount >= 3) {
      showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
      return;
    }
    
    printViaIframe('INVOICE');
    try {
      await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/increment-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
  };

  const handlePrintReceipt = () => {
    printViaIframe('RECEIPT');
  };

  const handleCheckout = async (orderId: string) => {
    if (isProcessing || !selectedOrder) return;
    
    const currentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = Number(selectedOrder.totalAmount);
    
    // Allow small floating point variance
    if (Math.abs(orderTotal - currentTotal) > 0.01) {
      showToast(`Please settle the full amount of $${orderTotal.toFixed(2)}`, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const body = { payments };

      const res = await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'Failed to checkout');
      }
      showToast('Payment processed successfully', 'success', 'Paid');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to process payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cashier-layout">
      <h2>POS Cashier</h2>
      <p className="subtitle">Process payments for tables that have been served.</p>
      
      <div className="cashier-content">
        <div className="orders-list">
          {orders.length === 0 && <div className="no-orders">No orders waiting for payment.</div>}
          {orders.map(order => (
            <div 
              key={order.id} 
              className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="card-header">
                <h3>
                  {order.folio?.reservation?.room 
                    ? `Room ${order.folio.reservation.room.number}` 
                    : order.table?.number 
                      ? `Table ${order.table.number}` 
                      : 'Walk-in'}
                </h3>
                <span className="amount">${Number(order.totalAmount).toFixed(2)}</span>
              </div>
              {order.folio?.reservation?.guest && (
                <p style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.85rem', marginTop: '-4px', marginBottom: '8px' }}>
                  {order.folio.reservation.guest.firstName} {order.folio.reservation.guest.lastName}
                </p>
              )}
              <p className="items-count">{order.items.length} items</p>
            </div>
          ))}
        </div>

        {selectedOrder && (
          <div className="checkout-panel">
            <div className="checkout-header">
              <h3>
                Checkout {selectedOrder.folio?.reservation?.room 
                  ? `Room ${selectedOrder.folio.reservation.room.number}` 
                  : selectedOrder.table?.number 
                    ? `Table ${selectedOrder.table.number}` 
                    : 'Walk-in'}
              </h3>
            </div>
            
            <div className="receipt">
                {selectedOrder.items.map(item => {
                  const isReturned = item.status === 'RETURNED';
                  return (
                  <div key={item.id} className={`receipt-item ${isReturned ? 'text-rose-400' : ''}`}>
                    <span className="qty">{item.quantity}x</span>
                    <span className="name">{isReturned ? '(Returned) ' : ''}{item.menuItem.name}</span>
                    <span className="price">{isReturned ? '-' : ''}${(Number(item.menuItem.price) * item.quantity).toFixed(2)}</span>
                  </div>
                )})}
              <div className="receipt-total">
                <span>Total Amount</span>
                <span>${Number(selectedOrder.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <div className="payment-entry-section">
              {payments.length > 0 && (
                <div className="payments-list" style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: 'white', fontSize: '0.875rem', marginBottom: '8px', marginTop: 0 }}>Payments Added</h4>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'hsl(222, 35%, 15%)', borderRadius: '4px', marginBottom: '4px' }}>
                      <span style={{ color: 'hsl(215, 20%, 65%)' }}>{p.method.replace('PAYMENT_', '')}</span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 600 }}>${p.amount.toFixed(2)}</span>
                        <button type="button" onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', color: 'hsl(0, 84%, 60%)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(217, 20%, 25%)' }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>Remaining Balance:</span>
                    <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 700 }}>
                      ${Math.max(0, Number(selectedOrder.totalAmount) - payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {payments.reduce((sum, p) => sum + p.amount, 0) < Number(selectedOrder.totalAmount) && (
                <div className="payment-entry-form" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)} 
                      max={Math.max(0, Number(selectedOrder.totalAmount) - payments.reduce((sum, p) => sum + p.amount, 0))}
                      style={{ width: '100%', padding: '10px', background: 'hsl(222, 35%, 10%)', border: '1px solid hsl(217, 20%, 20%)', color: 'white', borderRadius: '6px' }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>Method</label>
                    <select 
                      className="form-select" 
                      value={paymentMethod} 
                      onChange={e => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: 'hsl(222, 35%, 10%)', border: '1px solid hsl(217, 20%, 20%)', color: 'white', borderRadius: '6px' }}
                    >
                      <option value="PAYMENT_CASH">Cash</option>
                      <option value="PAYMENT_CARD">Credit Card</option>
                      <option value="PAYMENT_MOBILE">Mobile Money</option>
                      <option value="PAYMENT_BANK">Bank Transfer</option>
                    </select>
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleAddPayment}>Add</button>
                </div>
              )}
            </div>

            <div className="payment-actions">
              <button className="btn-secondary" onClick={() => handlePrintReceipt()}>
                Print Receipt
              </button>
              <button className="btn-secondary" onClick={() => handlePrintInvoice(selectedOrder.id)}>
                Print Invoice
              </button>
              <button 
                className="btn-pay" 
                disabled={isProcessing || payments.reduce((sum, p) => sum + p.amount, 0) < Number(selectedOrder.totalAmount) - 0.01} 
                onClick={() => handleCheckout(selectedOrder.id)}
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>

            {/* PRINT ONLY RECEIPT - MODERN 2026 DESIGN */}
            <div className="print-only-receipt modern-receipt">
              <div className="receipt-brand">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <h2>Yarvo</h2>
                <p>RESTAURANT & BAR</p>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-meta">
                <div className="meta-row">
                  <span className="meta-label">ORDER ID</span>
                  <span className="meta-value">#{selectedOrder.id.substring(0,8).toUpperCase()}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">TABLE / ROOM</span>
                  <span className="meta-value">
                    {selectedOrder.folio?.reservation?.room 
                      ? `Room ${selectedOrder.folio.reservation.room.number}` 
                      : selectedOrder.table?.number || 'Walk-in'}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">DATE</span>
                  <span className="meta-value">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-items">
                  {selectedOrder.items.map((item) => {
                    const isReturned = item.status === 'RETURNED';
                    return (
                    <div key={item.id} className={`modern-item ${isReturned ? 'text-rose-400' : ''}`}>
                      <div className="item-main">
                        <span className="item-qty">{item.quantity}x</span>
                        <span className="item-name">{isReturned ? '(Returned) ' : ''}{item.menuItem.name}</span>
                      </div>
                      <span className="item-price">{isReturned ? '-' : ''}${(Number(item.menuItem.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  )})}
                </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-totals">
                <div className="total-row grand-total">
                  <span>TOTAL</span>
                  <span>${Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="receipt-footer-modern">
                <svg className="qr-code" width="80" height="80" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10 10h30v30H10V10zm10 10v10h10V20H20zm40-10h30v30H60V10zm10 10v10h10V20H70zM10 60h30v30H10V60zm10 10v10h10V70H20zm40-10h10v10H60V60zm20 0h10v10H80V60zm-20 20h10v10H60V80zm20 0h10v10H80V80z"></path>
                </svg>
                <p>Scan to leave a review</p>
                <p className="thank-you">Thank you for choosing Yarvo</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cashier-layout { padding: 20px; display: flex; flex-direction: column; height: 100%; }
        .cashier-layout h2 { color: white; margin: 0 0 8px 0; font-size: 1.5rem; }
        .subtitle { color: hsl(215, 20%, 65%); margin-bottom: 24px; }
        
        .cashier-content {
          display: flex;
          gap: 24px;
          flex: 1;
          align-items: flex-start;
        }

        .orders-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
        }

        .order-card {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .order-card:hover { border-color: hsl(43,96%,56%, 0.5); }
        .order-card.selected {
          border-color: hsl(43,96%,56%);
          background: hsl(43,96%,56%, 0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .card-header h3 { margin: 0; color: white; font-size: 1.1rem; }
        .amount { color: hsl(43,96%,56%); font-weight: 700; font-size: 1.2rem; }
        .items-count { margin: 0; color: hsl(215, 20%, 50%); font-size: 0.9rem; }

        .checkout-panel {
          flex: 1;
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          padding: 24px;
          position: sticky;
          top: 24px;
        }

        .checkout-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid hsl(217, 20%, 16%);
        }
        .checkout-header h3 { margin: 0; color: white; }

        .receipt {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .receipt-item {
          display: flex;
          align-items: center;
          color: hsl(210, 40%, 92%);
        }
        .receipt-item .qty { width: 40px; color: hsl(215, 20%, 50%); }
        .receipt-item .name { flex: 1; }
        .receipt-item .price { font-weight: 500; }

        .receipt-total {
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1px dashed hsl(217, 20%, 26%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(43,96%,56%);
        }

        .payment-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn-pay {
          padding: 16px;
          background: hsl(142, 76%, 45%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-pay:hover:not(:disabled) { background: hsl(142, 76%, 40%); }
        .btn-pay:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-secondary {
          padding: 16px;
          background: hsl(220, 30%, 12%);
          color: hsl(210, 40%, 96%);
          border: 1px solid hsl(217, 20%, 20%);
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-secondary:hover { background: hsl(217, 20%, 18%); }
        .no-orders { color: hsl(215, 20%, 50%); font-size: 1.1rem; }
        
        .print-only-receipt {
          display: none;
        }

        @media print {
          .cashier-layout > h2,
          .cashier-layout > p,
          .orders-list,
          .checkout-header,
          .receipt,
          .payment-entry-section,
          .payment-actions {
            display: none !important;
          }
          
          .cashier-layout, .cashier-content, .checkout-panel {
            display: block !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          .print-only-receipt {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            z-index: 999999 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .modern-receipt {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            margin: 0 auto !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #000;
            background: #fff;
            max-width: 380px;
            padding: 24px;
            z-index: 9999;
          }
          
          .receipt-brand {
            text-align: center;
            margin-bottom: 24px;
          }
          .receipt-brand svg { margin-bottom: 12px; }
          .receipt-brand h2 { 
            font-size: 20px; 
            font-weight: 800; 
            letter-spacing: 2px; 
            margin: 0 0 4px 0; 
          }
          .receipt-brand p { 
            font-size: 11px; 
            font-weight: 500; 
            letter-spacing: 1.5px; 
            color: #555; 
            margin: 0; 
          }
          
          .receipt-divider {
            border-bottom: 2px dashed #000;
            margin: 16px 0;
            opacity: 0.2;
          }
          
          .receipt-meta {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          .meta-label { color: #666; font-weight: 500; }
          .meta-value { font-weight: 600; font-family: monospace; font-size: 13px; }
          
          .receipt-items {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .modern-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .item-main {
            display: flex;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
          }
          .item-qty { color: #666; font-weight: 500; }
          .item-price { font-size: 13px; font-weight: 600; font-family: monospace; }
          
          .receipt-totals { margin-top: 8px; }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: 800;
            margin-top: 8px;
          }
          
          .receipt-footer-modern {
            text-align: center;
            margin-top: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .qr-code { margin-bottom: 4px; }
          .receipt-footer-modern p { margin: 0; font-size: 11px; font-weight: 500; color: #555; }
          .receipt-footer-modern .thank-you { font-size: 14px; font-weight: 700; color: #000; margin-top: 4px; }
        }
      `}</style>
    </div>
  );
}

