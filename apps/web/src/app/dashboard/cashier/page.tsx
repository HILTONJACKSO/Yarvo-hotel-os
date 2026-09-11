'use client';

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
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
  receiptPrintCount: number;
  user?: { firstName: string; lastName: string };
  items: Array<{
    id: string;
    quantity: number;
    status?: string;
    menuItem: { name: string; price: string };
  }>;
};


const TransferModal = ({ isOpen, onClose, onTransferSuccess, API_URL }: any) => {
  const { showToast } = useToast();
  const [sourceOrderId, setSourceOrderId] = useState<string>('');
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [targetOrderId, setTargetOrderId] = useState<string>('');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      fetchTables();
      setSourceOrderId('');
      setTargetTableId('');
      setTargetOrderId('');
      setSelectedItems({});
    }
  }, [isOpen]);

  const fetchOrders = () => {
    Promise.all([
      fetch(`${API_URL}/api/v1/pos/orders`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${API_URL}/api/v1/pos/served-orders`, { credentials: 'include' }).then(r => r.json())
    ]).then(([active, served]) => {
      const activeData = active.data || active || [];
      const servedData = served.data || served || [];
      const combined = [...activeData, ...servedData];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setActiveOrders(unique);
    }).catch(console.error);
  };

  const fetchTables = () => {
    fetch(`${API_URL}/api/v1/pos/tables`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTables(data.data || data || []))
      .catch(console.error);
  };

  const sourceOrder = activeOrders.find(o => o.id === sourceOrderId);

  const handleItemSelect = (itemId: string, maxQty: number, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => ({ ...prev, [itemId]: maxQty }));
    } else {
      const newItems = { ...selectedItems };
      delete newItems[itemId];
      setSelectedItems(newItems);
    }
  };

  const handleQtyChange = (itemId: string, qty: number, maxQty: number) => {
    if (qty > maxQty) qty = maxQty;
    if (qty < 1) qty = 1;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleTransfer = async () => {
    if (!sourceOrderId) return showToast('Select a source order', 'error');
    if (!targetTableId && !targetOrderId) return showToast('Select a target table or order', 'error');
    const itemsToTransfer = Object.keys(selectedItems).map(id => ({ id, quantity: selectedItems[id] }));
    if (itemsToTransfer.length === 0) return showToast('Select at least one item to transfer', 'error');

    setIsTransferring(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pos/orders/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sourceOrderId,
          targetTableId: targetTableId || undefined,
          targetOrderId: targetOrderId || undefined,
          items: itemsToTransfer
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.message || 'Transfer failed');
      }

      showToast('Items transferred successfully', 'success');
      onTransferSuccess();
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Failed to transfer items', 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid hsl(43, 96%, 56%)' }}>
        <h3 className="text-xl font-semibold text-white mb-4" style={{ color: 'hsl(43, 96%, 56%)' }}>Transfer Items</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1 text-yellow-500 font-bold text-lg">From</label>
              <label className="block text-xs text-gray-400 mb-1">Source Order / Table</label>
              <select 
                className="w-full bg-[#1e293b] border border-[#334155] text-white rounded p-3"
                value={sourceOrderId}
                onChange={(e) => {
                  setSourceOrderId(e.target.value);
                  setSelectedItems({});
                }}
              >
                <option value="">Select source...</option>
                {activeOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.table?.number ? 'Table ' + o.table.number : 'Walk-in - ' + o.id.substring(0, 6)} - $ {Number(o.totalAmount).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1 text-yellow-500 font-bold text-lg">To</label>
              <label className="block text-xs text-gray-400 mb-1">New Destination</label>
              <select 
                className="w-full bg-[#1e293b] border border-[#334155] text-white rounded p-3"
                value={targetTableId ? 'table_' + targetTableId : targetOrderId ? 'order_' + targetOrderId : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('table_')) {
                    setTargetTableId(val.replace('table_', ''));
                    setTargetOrderId('');
                  } else if (val.startsWith('order_')) {
                    setTargetOrderId(val.replace('order_', ''));
                    setTargetTableId('');
                  } else {
                    setTargetTableId('');
                    setTargetOrderId('');
                  }
                }}
              >
                <option value="">Select destination...</option>
                <optgroup label="Tables">
                  {tables.map(t => (
                    <option key={'table_' + t.id} value={'table_' + t.id} disabled={t.id === sourceOrder?.tableId}>
                      Table {t.number}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Active Walk-ins">
                  {activeOrders.filter(o => !o.tableId).map(o => (
                    <option key={'order_' + o.id} value={'order_' + o.id} disabled={o.id === sourceOrderId}>
                      Walk-in - {o.id.substring(0,6)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {sourceOrder && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Select Items to Transfer</h4>
            <div className="bg-[#1e293b] rounded p-2">
              {sourceOrder.items.length === 0 && <div className="text-gray-500 text-sm p-2">No items in this order.</div>}
              {sourceOrder.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 border-b border-[#334155] last:border-0">
                  <input 
                    type="checkbox" 
                    checked={!!selectedItems[item.id]}
                    onChange={(e) => handleItemSelect(item.id, item.quantity, e.target.checked)}
                  />
                  <div className="flex-1 text-white text-sm">{item.menuItem.name}</div>
                  <div className="text-sm text-gray-400">Total Qty: {item.quantity}</div>
                  {!!selectedItems[item.id] && (
                    <input 
                      type="number" 
                      min="1" 
                      max={item.quantity}
                      className="w-16 bg-[#0f172a] border border-[#334155] text-white rounded p-1 text-sm text-center"
                      value={selectedItems[item.id]}
                      onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1, item.quantity)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button 
            className="px-4 py-2 bg-[#1e293b] text-white rounded hover:bg-[#334155]"
            onClick={onClose}
            disabled={isTransferring}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-[#d97706] text-white rounded hover:bg-[#b45309] font-medium"
            onClick={handleTransfer}
            disabled={isTransferring || Object.keys(selectedItems).length === 0 || (!targetTableId && !targetOrderId) || sourceOrderId === targetOrderId}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Items'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CashierPage() {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { showToast } = useToast();
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PosOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [printMode, setPrintMode] = useState<'RECEIPT' | 'INVOICE'>('RECEIPT');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCurrentUser(data.data || data))
      .catch(() => {});
  }, []);

  // Split payment state
  const [payments, setPayments] = useState<Array<{method: string; amount: number}>>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAYMENT_CASH');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');

  useEffect(() => {
    if (selectedOrder) {
      setPayments([]);
        setDiscountValue('');
        setDiscountType('PERCENT');
        setPaymentAmount(selectedOrder.totalAmount);
      setPaymentMethod('PAYMENT_CASH');
    }
  }, [selectedOrder]);

  const calculatedDiscount = selectedOrder 
    ? (discountType === 'PERCENT' ? (Number(selectedOrder.totalAmount) * (Number(discountValue || 0) / 100)) : Number(discountValue || 0))
    : 0;
  const finalTotal = selectedOrder ? Math.max(0, Number(selectedOrder.totalAmount) - calculatedDiscount) : 0;

  const handleAddPayment = () => {
    if (!selectedOrder) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    const currentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = finalTotal;
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

  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });

  const fetchOrders = () => {
    fetch(`${API_URL}/api/v1/pos/stats/cashier`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setStats(data?.data || data))
      .catch(console.error);

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
    const finalTotal = Math.max(0, orderTotal - calculatedDiscount);
    // Assuming 10% GST included in the price for display purposes
    const subtotal = orderTotal / 1.10;
    const gst = orderTotal - subtotal;

    doc.write(`
      <html>
        <head>
          <title>Print ${mode}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; max-width: 380px; margin: 0 auto; padding: 20px; }
            .header-container { text-align: center; margin-bottom: 20px; }
            .header-container img { max-width: 120px; margin-bottom: 10px; display: block; margin: 0 auto; }
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
          
          <div class="summary-row"><span>Subtotal</span><span>$${orderTotal.toFixed(2)}</span></div>
          <div class="summary-row"><span style="font-size: 11px; color: #555;">GST Included (10%)</span><span style="font-size: 11px; color: #555;">$${gst.toFixed(2)}</span></div>
          ${calculatedDiscount > 0 ? `<div class="summary-row" style="color: #dc2626;"><span>Discount</span><span>-$${calculatedDiscount.toFixed(2)}</span></div>` : ''}
          <div class="totals"><span>TOTAL</span><span>$${finalTotal.toFixed(2)}</span></div>
          
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
    const isStaff = currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    const isManager = currentUser?.roles?.some((r: any) => ['MANAGER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    
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

  const handlePrintReceipt = async (orderId: string) => {
    if (!selectedOrder) return;
    const isStaff = currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    const isManager = currentUser?.roles?.some((r: any) => ['MANAGER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
    
    if (isStaff && selectedOrder.receiptPrintCount >= 1) {
      showToast('Staff can only print a receipt once. Please contact management.', 'error');
      return;
    }
    if (isManager && selectedOrder.receiptPrintCount >= 3) {
      showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
      return;
    }
    
    printViaIframe('RECEIPT');
    try {
      await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/increment-receipt-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
    };
  
    const downloadReceiptPdf = async (orderId: string, isInvoice: boolean = false) => {
      if (!selectedOrder) return;
      
      const isStaff = currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
      const isManager = currentUser?.roles?.some((r: any) => ['MANAGER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
      
      if (isInvoice) {
        if (isStaff && selectedOrder.invoicePrintCount >= 1) {
          showToast('Staff can only print an invoice once. Please contact management.', 'error');
          return;
        }
        if (isManager && selectedOrder.invoicePrintCount >= 3) {
          showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
          return;
        }
      } else {
        if (isStaff && selectedOrder.receiptPrintCount >= 1) {
          showToast('Staff can only print a receipt once. Please contact management.', 'error');
          return;
        }
        if (isManager && selectedOrder.receiptPrintCount >= 3) {
          showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
          return;
        }
      }
  
      try {
        showToast('Generating PDF...', 'success');
        const element = document.querySelector(isInvoice ? '#kwalee-invoice' : '#kwalee-receipt') as HTMLElement;
        if (!element) {
          showToast('Receipt element not found', 'error');
          return;
        }
  
        const originalDisplay = element.style.display;
        element.style.display = 'block';
        element.style.position = 'absolute';
        element.style.top = '-9999px';
        
        const scale = 2;
          const imgData = await domtoimage.toPng(element, {
            bgcolor: '#ffffff',
            width: element.clientWidth * scale,
            height: element.clientHeight * scale,
            style: {
              transform: 'scale('+scale+')',
              transformOrigin: 'top left'
            }
          });
          
          element.style.display = originalDisplay;
          element.style.position = '';
          element.style.top = '';
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, 297]
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${isInvoice ? 'Invoice' : 'Receipt'}_${selectedOrder.id.substring(0,8)}.pdf`);
        const endpoint = isInvoice ? 'increment-print' : 'increment-receipt-print';
        await fetch(`${API_URL}/api/v1/pos/orders/${orderId}/${endpoint}`, { method: 'POST', credentials: 'include' });
        fetchOrders();
      } catch (err) {
        console.error('PDF generation error:', err);
        showToast('Failed to generate PDF', 'error');
      }
    };

    const canSettle = currentUser?.roles?.some((r: any) => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'FRONT_DESK'].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
  
    const handleCheckout = async (orderId: string) => {
    if (isProcessing || !selectedOrder) return;
    
    const currentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = Number(selectedOrder.totalAmount);
    const finalTotal = Math.max(0, orderTotal - calculatedDiscount);
    
    // Allow small floating point variance
    if (Math.abs(finalTotal - currentTotal) > 0.01) {
      showToast(`Please settle the full amount of $${finalTotal.toFixed(2)}`, 'error');
      return;
    }

    setIsProcessing(true);
    try {      const body = { payments, discountAmount: calculatedDiscount };

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

  if (currentUser?.roles?.some((r: any) => ['WAITSTAFF', 'STAFF_WAITER'].includes(r.name?.toUpperCase() || r.toUpperCase() || r))) {
    return (
      <div className="cashier-layout">
        <div style={{ marginTop: "24px", padding: "16px", background: "rgba(255, 0, 0, 0.1)", color: "#ff6b6b", borderRadius: "8px", border: "1px solid #ff6b6b" }}>
          <strong>Access Denied:</strong> Waitstaff are not authorized to view the POS Cashier dashboard. Please contact management.
        </div>
      </div>
    );
  }

  return (
    <div className="cashier-layout">
      <div className="welcome-banner" style={{ marginBottom: '28px' }}>
        <div className="welcome-text">
          <p className="welcome-greeting">Good day,</p>
          <h2 className="welcome-name">{currentUser?.firstName || 'Cashier'} {currentUser?.lastName || ''}</h2>
          <p className="welcome-sub">Here's what's happening at the POS today.</p>
        </div>
        <div className="welcome-badge">
          <span className="role-chip">CASHIER</span>
        </div>
      </div>

      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onTransferSuccess={fetchOrders} API_URL={API_URL} />
        <div className="coming-soon-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215, 20%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div className="stat-value"></div>
            <div className="stat-title">Total Revenue Generated</div>
            <div className="stat-desc">Payments received today</div>
          </div>
          <div className="stat-card cursor-pointer hover:border-yellow-500 transition-colors" style={{ border: '1px solid hsl(43, 96%, 56%)' }} onClick={() => setIsTransferModalOpen(true)}>
            <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(43, 96%, 56%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v18"/><path d="m10 18 7 3 7-3"/><path d="M7 21V3"/><path d="m14 6-7-3-7 3"/></svg></div>
            <div className="stat-value" style={{ color: 'hsl(43, 96%, 56%)' }}>Transfer Items</div>
            <div className="stat-title">Between Tables/Orders</div>
            <div className="stat-desc">Move items from one table to another</div>
          </div>
      </div>

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
              <div className="receipt-total" style={{ borderBottom: calculatedDiscount > 0 ? 'none' : '', paddingBottom: calculatedDiscount > 0 ? '4px' : '' }}>
                  <span>Subtotal</span>
                  <span>${Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="receipt-total" style={{ borderTop: 'none', paddingTop: '4px', marginTop: 0, color: 'hsl(142, 76%, 45%)' }}>
                    <span>Discount</span>
                    <span>-${calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="receipt-total" style={{ borderTop: calculatedDiscount > 0 ? 'none' : '' }}>
                  <span>Total Amount</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
            </div>

            <div className="discount-entry" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>Discount</label>
                  <input 
                    type="number" 
                    min="0"
                    value={discountValue} 
                    onChange={e => {
                        setDiscountValue(e.target.value);
                        const curDiscount = discountType === 'PERCENT' ? (Number(selectedOrder.totalAmount) * (Number(e.target.value || 0) / 100)) : Number(e.target.value || 0);
                        setPaymentAmount(Math.max(0, Number(selectedOrder.totalAmount) - curDiscount - payments.reduce((s, p) => s + p.amount, 0)).toFixed(2));
                    }} 
                    style={{ width: '100%', padding: '10px', background: 'hsl(222, 35%, 10%)', border: '1px solid hsl(217, 20%, 20%)', color: 'white', borderRadius: '6px' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>Type</label>
                  <select 
                    value={discountType} 
                    onChange={e => {
                        const newType = e.target.value as 'PERCENT' | 'FLAT';
                        setDiscountType(newType);
                        const curDiscount = newType === 'PERCENT' ? (Number(selectedOrder.totalAmount) * (Number(discountValue || 0) / 100)) : Number(discountValue || 0);
                        setPaymentAmount(Math.max(0, Number(selectedOrder.totalAmount) - curDiscount - payments.reduce((s, p) => s + p.amount, 0)).toFixed(2));
                    }}
                    style={{ width: '100%', padding: '10px', background: 'hsl(222, 35%, 10%)', border: '1px solid hsl(217, 20%, 20%)', color: 'white', borderRadius: '6px' }}
                  >
                    <option value="PERCENT">%</option>
                    <option value="FLAT">$</option>
                  </select>
                </div>
              </div>
              {canSettle ? (<div className="payment-entry-section">
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
                      ${Math.max(0, finalTotal - payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {payments.reduce((sum, p) => sum + p.amount, 0) < finalTotal && (
                <div className="payment-entry-form" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)} 
                      max={Math.max(0, finalTotal - payments.reduce((sum, p) => sum + p.amount, 0))}
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

            ) : (<div style={{ marginTop: "24px", padding: "16px", background: "rgba(255, 0, 0, 0.1)", color: "#ff6b6b", borderRadius: "8px", border: "1px solid #ff6b6b" }}><strong>Access Denied:</strong> You are not authorized to settle Restaurant or Bar bills. Please contact a Cashier or Manager.</div>)}
            <div className="payment-actions">
              <button className="btn-secondary" onClick={() => downloadReceiptPdf(selectedOrder.id, false)}>
                Print Receipt
              </button>
              <button className="btn-secondary" onClick={() => downloadReceiptPdf(selectedOrder.id, true)}>
                Print Invoice
              </button>
              <button 
                className="btn-pay" 
                disabled={isProcessing || payments.reduce((sum, p) => sum + p.amount, 0) < finalTotal - 0.01} 
                onClick={() => handleCheckout(selectedOrder.id)}
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>

            {/* ORIGINAL KWAALEE BEACH RESORT RECEIPTS */}
            <div className="print-only-container">
              <div id="kwalee-receipt" className="kwalee-receipt">
                <div className="header-container">
                  <img src="/kwalee-logo.png" alt="Logo" style={{ maxWidth: '120px', marginBottom: '10px', display: 'block', margin: '0 auto' }} />
                  <div className="header-title">KWAALEE BEACH RESORT</div>
                  <div className="header-info">www.kwaleebeachresort.com</div>
                  <div className="header-info">+231 774 340 843 / +231 881 774 350</div>
                  <div className="header-info">Kpakpa Kon, Marshall, Lower Margibi County, Liberia</div>
                </div>
                
                <div className="divider"></div>
                <p className="sub">CUSTOMER RECEIPT</p>
                
                <div className="meta"><span>ORDER ID</span> <span>#{selectedOrder.id.substring(0,8).toUpperCase()}</span></div>
                <div className="meta"><span>LOCATION</span> <span>{selectedOrder.folio?.reservation?.room ? `Room ${selectedOrder.folio.reservation.room.number}` : selectedOrder.table?.number || 'Walk-in'}</span></div>
                <div className="meta"><span>DATE</span> <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span></div>
                
                <div className="divider"></div>
                
                {selectedOrder.items.map((item) => {
                  const isReturned = item.status === 'RETURNED';
                  const displayName = isReturned ? `(Returned) ${item.menuItem.name}` : item.menuItem.name;
                  const displayPrice = isReturned 
                    ? `-$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`
                    : `$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`;
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: isReturned ? '#dc2626' : '#000' }}>
                      <div><span style={{ marginRight: '8px', color: '#000' }}>{item.quantity}x</span><span style={{ color: '#000' }}>{displayName}</span></div>
                      <span style={{ color: '#000' }}>{displayPrice}</span>
                    </div>
                  );
                })}
                
                <div className="divider"></div>
                
                <div className="summary-row"><span>Subtotal</span><span>${Number(selectedOrder.totalAmount).toFixed(2)}</span></div>
                <div className="summary-row"><span style={{ fontSize: '11px', color: '#555' }}>GST Included (10%)</span><span style={{ fontSize: '11px', color: '#555' }}>${((Number(selectedOrder.totalAmount)) - (Number(selectedOrder.totalAmount) / 1.10)).toFixed(2)}</span></div>
                {calculatedDiscount > 0 && <div className="summary-row" style={{ color: '#dc2626' }}><span>Discount</span><span>-${calculatedDiscount.toFixed(2)}</span></div>}
                <div className="totals"><span>TOTAL</span><span>${finalTotal.toFixed(2)}</span></div>
                
                <div className="footer">
                  <p><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
                  <p>Served by: {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'Staff'}</p>
                </div>
                
                <div className="footer-terms">
                  <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
                  Payment is due immediately upon receipt of this invoice unless otherwise agreed. All prices are subject to applicable charges. Any additional orders or services will be added to the final bill.
                  <br/><br/>
                  Thank you for choosing Kwalee Beach Restaurant.
                </div>
              </div>

              <div id="kwalee-invoice" className="kwalee-receipt">
                <div className="header-container">
                  <img src="/kwalee-logo.png" alt="Logo" style={{ maxWidth: '120px', marginBottom: '10px', display: 'block', margin: '0 auto' }} />
                  <div className="header-title">KWAALEE BEACH RESORT</div>
                  <div className="header-info">www.kwaleebeachresort.com</div>
                  <div className="header-info">+231 774 340 843 / +231 881 774 350</div>
                  <div className="header-info">Kpakpa Kon, Marshall, Lower Margibi County, Liberia</div>
                </div>
                
                <div className="divider"></div>
                <p className="sub">CUSTOMER INVOICE</p>
                
                <div className="meta"><span>ORDER ID</span> <span>#{selectedOrder.id.substring(0,8).toUpperCase()}</span></div>
                <div className="meta"><span>LOCATION</span> <span>{selectedOrder.folio?.reservation?.room ? `Room ${selectedOrder.folio.reservation.room.number}` : selectedOrder.table?.number || 'Walk-in'}</span></div>
                <div className="meta"><span>DATE</span> <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span></div>
                
                <div className="divider"></div>
                
                {selectedOrder.items.map((item) => {
                  const isReturned = item.status === 'RETURNED';
                  const displayName = isReturned ? `(Returned) ${item.menuItem.name}` : item.menuItem.name;
                  const displayPrice = isReturned 
                    ? `-$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`
                    : `$${(Number(item.menuItem.price) * item.quantity).toFixed(2)}`;
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: isReturned ? '#dc2626' : '#000' }}>
                      <div><span style={{ marginRight: '8px', color: '#000' }}>{item.quantity}x</span><span style={{ color: '#000' }}>{displayName}</span></div>
                      <span style={{ color: '#000' }}>{displayPrice}</span>
                    </div>
                  );
                })}
                
                <div className="divider"></div>
                
                <div className="summary-row"><span>Subtotal</span><span>${Number(selectedOrder.totalAmount).toFixed(2)}</span></div>
                <div className="summary-row"><span style={{ fontSize: '11px', color: '#555' }}>GST Included (10%)</span><span style={{ fontSize: '11px', color: '#555' }}>${((Number(selectedOrder.totalAmount)) - (Number(selectedOrder.totalAmount) / 1.10)).toFixed(2)}</span></div>
                {calculatedDiscount > 0 && <div className="summary-row" style={{ color: '#dc2626' }}><span>Discount</span><span>-${calculatedDiscount.toFixed(2)}</span></div>}
                <div className="totals"><span>TOTAL</span><span>${finalTotal.toFixed(2)}</span></div>
                
                <div style={{ marginTop: '50px', textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto 8px auto' }}></div>
                  <p style={{ fontSize: '12px', margin: 0, color: '#000' }}>Customer Signature</p>
                </div>

                <div className="footer">
                  <p><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
                  <p>Served by: {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'Staff'}</p>
                </div>
                
                <div className="footer-terms">
                  <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
                  Payment is due immediately upon receipt of this invoice unless otherwise agreed. All prices are subject to applicable charges. Any additional orders or services will be added to the final bill.
                  <br/><br/>
                  Thank you for choosing Kwalee Beach Restaurant.
                </div>
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
        
        .print-only-container {
          display: none;
        }
        .kwalee-receipt {
          font-family: 'Courier New', Courier, monospace; 
          color: #000 !important; 
          background: #fff !important;
          max-width: 380px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .kwalee-receipt .header-container { text-align: center; margin-bottom: 20px; }
        .kwalee-receipt .header-title { font-size: 20px; font-weight: bold; margin: 0 0 4px 0; color: #000; }
        .kwalee-receipt .header-info { font-size: 12px; margin: 0; line-height: 1.4; color: #000; }
        .kwalee-receipt p.sub { text-align: center; font-size: 14px; font-weight: bold; margin: 20px 0; color: #000; }
        .kwalee-receipt .divider { border-bottom: 1px dashed #000; margin: 12px 0; opacity: 0.4; }
        .kwalee-receipt .meta { font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; color: #000; }
        .kwalee-receipt .meta span:first-child { color: #666; }
        .kwalee-receipt .summary-row { font-size: 14px; display: flex; justify-content: space-between; margin-top: 8px; color: #000; }
        .kwalee-receipt .summary-row span { color: #000; }
        .kwalee-receipt .totals { font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 12px; color: #000; }
        .kwalee-receipt .totals span { color: #000; }
        .kwalee-receipt .footer { text-align: center; font-size: 11px; margin-top: 40px; color: #333; line-height: 1.5; }
        .kwalee-receipt .footer p { color: #000; }
        .kwalee-receipt .footer-terms { text-align: left; font-size: 10px; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; color: #555; }
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

          .print-only-container {
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
          .modern-receipt, .modern-receipt * {
            color: #000 !important;
          }
          `}</style>
    </div>
  );
}

