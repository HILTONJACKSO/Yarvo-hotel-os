'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncOfflineMutations, downloadLatestData } from '@/lib/sync';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { useToast } from '@/components/ui/toast-provider';
import { useCurrency } from '@/lib/currency';
import { useAuth } from '@/lib/auth-provider';
import { getDefaultReceiptInvoiceSettings, generateThermalReceiptHtml } from '@/lib/receipt-invoice-helper';
import ReturnItemModal from '@/components/pos/ReturnItemModal';
import { Check, Clock, AlertTriangle, RotateCcw, X, Lock, Unlock, ShieldCheck, CheckCircle2, Tag, Percent } from 'lucide-react';
const API_URL = '';

type PosOrder = {
  id: string;
  totalAmount: string;
  discountAmount?: number | string;
  discountReason?: string;
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
  const { format } = useCurrency();
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

  const fetchOrders = async () => {
    const combined = await db.posOrders.toArray();
    const unique = Array.from(new Map(combined.map((item: any) => [item.id, item])).values());
    const active = unique.filter((o: any) => 
      ['OPEN', 'SERVED', 'PREPARING', 'READY'].includes(o.status) &&
      o.status !== 'PAID' &&
      o.status !== 'CANCELLED' &&
      o.status !== 'BILLED_TO_ROOM' &&
      ((o.items && o.items.length > 0) || Number(o.totalAmount || 0) > 0)
    );
    setActiveOrders(active);
  };

  const fetchTables = async () => {
    const data = await db.posTables.toArray();
    const sorted = [...(data || [])].sort((a, b) => {
      const numA = parseInt(String(a.number).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.number).replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.number).localeCompare(String(b.number));
    });
    setTables(sorted);
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
      await db.syncQueue.add({
        url: `/api/v1/pos/orders/transfer`,
        method: 'POST',
        payload: {
          sourceOrderId,
          targetTableId: targetTableId || undefined,
          targetOrderId: targetOrderId || undefined,
          items: itemsToTransfer
        },
        createdAt: Date.now(),
        status: 'PENDING',
        retryCount: 0
      });
      if (navigator.onLine) syncOfflineMutations();

      showToast('Items transferred successfully (Offline)', 'success');
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
              <label className="block text-sm text-[#6B6F72]/80 mb-1 text-yellow-500 font-bold text-lg">From</label>
              <label className="block text-xs text-[#6B6F72]/80 mb-1">Source Order / Table</label>
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
                    {o.table?.number ? 'Table ' + o.table.number : 'Walk-in - ' + o.id.substring(0, 6)} - {format(Number(o.totalAmount))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6B6F72]/80 mb-1 text-yellow-500 font-bold text-lg">To</label>
              <label className="block text-xs text-[#6B6F72]/80 mb-1">New Destination</label>
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
              {sourceOrder.items.length === 0 && <div className="text-[#6B6F72] text-sm p-2">No items in this order.</div>}
              {sourceOrder.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-2 border-b border-[#334155] last:border-0">
                  <input 
                    type="checkbox" 
                    checked={!!selectedItems[item.id]}
                    onChange={(e) => handleItemSelect(item.id, item.quantity, e.target.checked)}
                  />
                  <div className="flex-1 text-white text-sm">{item.menuItem.name}</div>
                  <div className="text-sm text-[#6B6F72]/80">Total Qty: {item.quantity}</div>
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
  const { user } = useAuth();
  const { format, currencySymbol } = useCurrency();
  const property = useLiveQuery(() => db.properties.toCollection().first());
  const receiptSettings = getDefaultReceiptInvoiceSettings(property);
  const hotelName = receiptSettings.businessName;
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { showToast } = useToast();
  const orders: any[] = useLiveQuery(() => db.posOrders.toArray())?.filter((o: any) => 
    (o.status === 'SERVED' || o.status === 'OPEN') &&
    ((o.items && o.items.length > 0) || Number(o.totalAmount || 0) > 0)
  ) || [];
  const isOrderFullyServed = (order: any) => {
    if (!order || !order.items || order.items.length === 0) return false;
    return order.items.every((i: any) => ['SERVED', 'DELIVERED', 'RETURNED', 'CANCELLED'].includes(i.status));
  };
  const handleVoidEmptyOrder = async (orderId: string) => {
    try {
      await fetch(`/api/v1/pos/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await db.posOrders.delete(orderId);
      setSelectedOrder(null);
      await fetchOrders();
      await downloadLatestData();
      showToast('Empty order removed successfully', 'success', 'Order Removed');
    } catch {
      await db.posOrders.delete(orderId);
      setSelectedOrder(null);
      await fetchOrders();
    }
  };
  const [filterTab, setFilterTab] = useState<'READY' | 'PREPARING' | 'ALL'>('READY');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isReversingDiscount, setIsReversingDiscount] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setPayments([]);
      const existingDiscount = Number(selectedOrder.discountAmount || 0);
      let meta: any = null;
      if (selectedOrder.discountReason) {
        try { meta = JSON.parse(selectedOrder.discountReason); } catch {}
      }

      if (existingDiscount > 0) {
        setDiscountValue(meta?.value !== undefined ? String(meta.value) : String(existingDiscount));
        setDiscountType(meta?.type === 'FLAT' ? 'FLAT' : (meta?.type === 'PERCENT' ? 'PERCENT' : 'FLAT'));
      } else {
        setDiscountValue('');
        setDiscountType('PERCENT');
      }

      const orderTotal = Math.max(0, Number(selectedOrder.totalAmount) - existingDiscount);
      setPaymentAmount(orderTotal > 0 ? orderTotal.toFixed(2) : '');
      setPaymentMethod('PAYMENT_CASH');
    }
  }, [selectedOrder?.id, selectedOrder?.discountAmount, selectedOrder?.discountReason]);

  const isDiscountApplied = Number(selectedOrder?.discountAmount || 0) > 0;
  let discountMeta: any = null;
  if (selectedOrder?.discountReason) {
    try { discountMeta = JSON.parse(selectedOrder.discountReason); } catch {}
  }
  const discountModifiedCount = Number(discountMeta?.modifiedCount || 0);

  const calculatedDiscount = isDiscountApplied
    ? Number(selectedOrder?.discountAmount || 0)
    : 0;

  const previewDiscount = (!isDiscountApplied && discountValue && parseFloat(discountValue) > 0 && selectedOrder)
    ? (discountType === 'PERCENT'
        ? (Number(selectedOrder.totalAmount) * (parseFloat(discountValue) / 100))
        : parseFloat(discountValue))
    : 0;

  const finalTotal = selectedOrder ? Math.max(0, Number(selectedOrder.totalAmount) - calculatedDiscount) : 0;

  const handleApplyDiscount = async () => {
    if (!selectedOrder) return;
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid discount amount greater than 0', 'error');
      return;
    }

    const orderSubtotal = Number(selectedOrder.totalAmount || 0);
    const amount = discountType === 'PERCENT' ? (orderSubtotal * (val / 100)) : val;

    if (amount > orderSubtotal) {
      showToast('Discount cannot exceed the total order amount', 'error');
      return;
    }

    try {
      setIsApplyingDiscount(true);
      const res = await fetch(`/api/v1/pos/orders/${selectedOrder.id}/apply-discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          value: val,
          type: discountType,
          reason: `Discount of ${val}${discountType === 'PERCENT' ? '%' : currencySymbol}`
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to apply discount');
      }

      const updated = await res.json();
      const updatedOrder = updated.data || updated;

      setSelectedOrder(updatedOrder);
      await db.posOrders.put(updatedOrder);

      const remaining = Math.max(0, Number(updatedOrder.totalAmount) - Number(updatedOrder.discountAmount || 0) - payments.reduce((s, p) => s + p.amount, 0));
      setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');

      showToast(`Discount of ${format(amount)} applied and saved!`, 'success', 'Discount Confirmed');
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply discount', 'error', 'Error');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleReverseDiscount = async () => {
    if (!selectedOrder) return;
    const roles = getEffectiveRoles();
    const isCeoOrAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
    const isManager = roles.includes('MANAGER');
    const isCashierOnly = !isCeoOrAdmin && !isManager;

    if (isCashierOnly) {
      showToast('Cashiers are not permitted to reverse or alter discounts.', 'error', 'Access Denied');
      return;
    }
    if (isManager && !isCeoOrAdmin && discountModifiedCount >= 1) {
      showToast('Managers can only modify or reverse a discount once. Contact CEO/Admin.', 'error', 'Limit Reached');
      return;
    }

    try {
      setIsReversingDiscount(true);
      const res = await fetch(`/api/v1/pos/orders/${selectedOrder.id}/reverse-discount`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reverse discount');
      }

      const updated = await res.json();
      const updatedOrder = updated.data || updated;

      setSelectedOrder(updatedOrder);
      await db.posOrders.put(updatedOrder);
      setDiscountValue('');

      const remaining = Math.max(0, Number(updatedOrder.totalAmount) - payments.reduce((s, p) => s + p.amount, 0));
      setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');

      showToast('Discount successfully reversed and removed.', 'success', 'Discount Removed');
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to reverse discount', 'error', 'Error');
    } finally {
      setIsReversingDiscount(false);
    }
  };

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

  const fetchOrders = async () => {
    if (navigator.onLine) {
      await downloadLatestData();
      try {
        const res = await fetch('/api/v1/pos/stats/cashier', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.data) setStats(data.data);
          else if (data.totalOrders !== undefined) setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    } else if (!navigator.onLine) {
      const allOrders = await db.posOrders.toArray();
      const today = new Date().toISOString().split('T')[0];
      const settled = allOrders.filter(o => 
        (o.updatedAt || o.createdAt || "").startsWith(today) && 
        ['PAID', 'BILLED_TO_ROOM'].includes(o.status)
      );
      let totalRev = 0;
      settled.forEach((o: any) => {
        let orderGross = 0;
        (o.items || []).forEach((item: any) => {
          if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(item.status)) return;
          if (item.returnRequest && item.returnRequest.status !== 'REJECTED') return;
          orderGross += (item.quantity || 1) * Number(item.menuItem?.price || 0);
        });
        const discount = Number(o.discountAmount || 0);
        totalRev += Math.max(0, orderGross - discount);
      });
      setStats({ totalOrders: settled.length, totalRevenue: Number(totalRev.toFixed(2)) });
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const [returnModalItem, setReturnModalItem] = useState<{
    id: string;
    name: string;
    quantity: number;
    price: number | string;
    tableOrRoom?: string;
  } | null>(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const handleReturnSubmit = async ({ itemId, reason, quantity, note }: { itemId: string; reason: string; quantity: number; note: string }) => {
    setIsSubmittingReturn(true);
    try {
      if (navigator.onLine) {
        const res = await fetch(`/api/v1/pos/order-items/${itemId}/return-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reason, quantity, note })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Failed to submit return request (${res.status})`);
        }
        await downloadLatestData();
        await fetchOrders();
      } else {
        await db.syncQueue.add({
          url: `/api/v1/pos/order-items/${itemId}/return-request`,
          method: 'POST',
          payload: { reason, quantity, note },
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0
        });
      }

      showToast('Return requested successfully. Sent for manager approval.', 'success', 'Success');
      setReturnModalItem(null);
      // Update selectedOrder view locally
      if (selectedOrder) {
        setSelectedOrder((prev: any) => prev ? {
          ...prev,
          items: prev.items.map((i: any) => i.id === itemId ? { ...i, status: 'RETURN_REQUESTED' } : i)
        } : null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to request return', 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const printViaIframe = (mode: 'RECEIPT' | 'INVOICE') => {
    if (!selectedOrder) return;

    const orderTotal = Number(selectedOrder.totalAmount);
    const finalTotal = Math.max(0, orderTotal - calculatedDiscount);
    const subtotal = orderTotal / 1.10;
    const gst = orderTotal - subtotal;

    const formattedItems = selectedOrder.items.map((item: any) => {
      const isReturned = item.status === 'RETURNED';
      const displayName = item.menuItem.name;
      const displayPrice = isReturned 
          ? format(0)
          : format(Number(item.menuItem.price) * item.quantity);
      return {
        name: displayName,
        quantity: item.quantity,
        price: format(Number(item.menuItem.price)),
        total: displayPrice,
        isReturned
      };
    });

    const destinationLabel = selectedOrder.folio?.reservation?.room 
      ? `Room ${selectedOrder.folio.reservation.room.number}` 
      : (selectedOrder.table?.number ? `Table ${selectedOrder.table.number}` : 'Walk-in');

    const serverName = selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'Staff';

    const thermalHtml = generateThermalReceiptHtml({
      settings: receiptSettings,
      orderId: selectedOrder.id,
      orderDate: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      destinationLabel,
      serverName,
      items: formattedItems,
      subtotal: format(subtotal),
      tax: format(gst),
      taxLabel: 'GST / Tax (10% Included)',
      discount: calculatedDiscount > 0 ? format(calculatedDiscount) : undefined,
      total: format(finalTotal),
      isInvoiceMode: mode === 'INVOICE',
    });

    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(thermalHtml);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {
            console.error('Mobile print error:', e);
          }
        }, 500);
        return;
      }
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      downloadReceiptPdf(selectedOrder.id, mode === 'INVOICE');
      return;
    }

    doc.open();
    doc.write(thermalHtml);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        downloadReceiptPdf(selectedOrder.id, mode === 'INVOICE');
      }
      setTimeout(() => { 
        if (document.body.contains(iframe)) document.body.removeChild(iframe); 
      }, 1500);
    }, 250);
  };

  const getEffectiveRoles = () => {
    const list = user?.roles || currentUser?.roles || [];
    return list.map((r: any) => (typeof r === 'string' ? r : r?.name || '').toUpperCase());
  };

  const handlePrintInvoice = async (orderId: string) => {
    if (!selectedOrder) return;
    const roles = getEffectiveRoles();
    const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
    const isManager = roles.includes('MANAGER');
    const isStaff = roles.some((r: string) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN', 'POS_CASHIER'].includes(r));
    
    if (!isAdmin) {
      if (isManager && selectedOrder.invoicePrintCount >= 3) {
        showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
        return;
      }
      if (!isManager && isStaff && selectedOrder.invoicePrintCount >= 1) {
        showToast('Staff can only print an invoice once. Please contact management.', 'error');
        return;
      }
    }
    
    printViaIframe('INVOICE');
    setSelectedOrder((prev: any) => prev ? { ...prev, invoicePrintCount: (prev.invoicePrintCount || 0) + 1 } : null);
    try {
      await fetch(`/api/v1/pos/orders/${orderId}/increment-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
  };

  const handlePrintReceipt = async (orderId: string) => {
    if (!selectedOrder) return;
    const roles = getEffectiveRoles();
    const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
    const isManager = roles.includes('MANAGER');
    const isStaff = roles.some((r: string) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN', 'POS_CASHIER'].includes(r));
    
    if (!isAdmin) {
      if (isManager && selectedOrder.receiptPrintCount >= 3) {
        showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
        return;
      }
      if (!isManager && isStaff && selectedOrder.receiptPrintCount >= 1) {
        showToast('Staff can only print a receipt once. Please contact management.', 'error');
        return;
      }
    }
    
    printViaIframe('RECEIPT');
    setSelectedOrder((prev: any) => prev ? { ...prev, receiptPrintCount: (prev.receiptPrintCount || 0) + 1 } : null);
    try {
      await fetch(`/api/v1/pos/orders/${orderId}/increment-receipt-print`, { method: 'POST', credentials: 'include' });
      fetchOrders();
    } catch(e) {}
  };
  
    const downloadReceiptPdf = async (orderId: string, isInvoice: boolean = false) => {
      if (!selectedOrder) return;
      
      const roles = getEffectiveRoles();
      const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
      const isManager = roles.includes('MANAGER');
      const isStaff = roles.some((r: string) => ['WAITSTAFF', 'CASHIER', 'BAR', 'KITCHEN', 'POS_CASHIER'].includes(r));
      
      if (!isAdmin) {
        if (isInvoice) {
          if (isManager && selectedOrder.invoicePrintCount >= 3) {
            showToast('Manager can only print an invoice 3 times. Please contact CEO.', 'error');
            return;
          }
          if (!isManager && isStaff && selectedOrder.invoicePrintCount >= 1) {
            showToast('Staff can only print an invoice once. Please contact management.', 'error');
            return;
          }
        } else {
          if (isManager && selectedOrder.receiptPrintCount >= 3) {
            showToast('Manager can only print a receipt 3 times. Please contact CEO.', 'error');
            return;
          }
          if (!isManager && isStaff && selectedOrder.receiptPrintCount >= 1) {
            showToast('Staff can only print a receipt once. Please contact management.', 'error');
            return;
          }
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
        setSelectedOrder((prev: any) => prev ? { ...prev, [isInvoice ? 'invoicePrintCount' : 'receiptPrintCount']: (prev[isInvoice ? 'invoicePrintCount' : 'receiptPrintCount'] || 0) + 1 } : null);
        await fetch(`/api/v1/pos/orders/${orderId}/${endpoint}`, { method: 'POST', credentials: 'include' });
        fetchOrders();
      } catch (err) {
        console.error('PDF generation error:', err);
        showToast('Failed to generate PDF', 'error');
      }
    };

    const effectiveRoles = getEffectiveRoles();
    const canSettle = effectiveRoles.some((r: any) => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'CASHIER', 'FRONT_DESK'].includes(r));
    const canManageReturns = effectiveRoles.some((r: any) => ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR'].includes(r));
  
    const handleInlineApproveReturn = async (itemId: string, approved: boolean) => {
      try {
        showToast(approved ? 'Approving return...' : 'Rejecting return...', 'info');
        const res = await fetch(`/api/v1/pos/order-items/${itemId}/approve-return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ approved })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to update return');
        }

        showToast(approved ? 'Return approved successfully' : 'Return rejected', 'success', 'Success');
        
        if (selectedOrder) {
          const newStatus = approved ? 'RETURNED' : 'SERVED';
          const updatedItems = selectedOrder.items.map((i: any) => i.id === itemId ? { ...i, status: newStatus } : i);
          const updatedOrder = { ...selectedOrder, items: updatedItems };
          setSelectedOrder(updatedOrder);
          await db.posOrders.put(updatedOrder);
        }
        await downloadLatestData();
        await fetchOrders();
      } catch (err: any) {
        showToast(err.message || 'Failed to process return', 'error');
      }
    };

    const handleCheckout = async (orderId: string) => {
    if (isProcessing || !selectedOrder) return;
    
    if (!isOrderFullyServed(selectedOrder)) {
      showToast('Cannot settle order: All items must be delivered by waitstaff first.', 'error');
      return;
    }

        if (!isDiscountApplied && discountValue && parseFloat(discountValue) > 0) {
      showToast('You have entered an unconfirmed discount. Please click "Apply & Confirm Discount" to lock it, or clear the discount field.', 'error', 'Unconfirmed Discount');
      return;
    }
    const isRoomOrder = Boolean(selectedOrder.folioId || selectedOrder.folio?.reservation?.room || selectedOrder.folio?.id);
    const currentTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = Number(selectedOrder.totalAmount);
    const finalTotal = Math.max(0, orderTotal - calculatedDiscount);
    
    // Allow small floating point variance for non-room walk-in orders
    if (!isRoomOrder && Math.abs(finalTotal - currentTotal) > 0.01) {
      showToast(`Please settle the full amount of ${format(finalTotal)}`, 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const targetFolioId = selectedOrder.folioId || selectedOrder.folio?.id;
      const nextStatus = isRoomOrder ? 'BILLED_TO_ROOM' : 'PAID';
      
      const payload: any = { 
        discountAmount: calculatedDiscount,
        discountReason: calculatedDiscount > 0 ? `Discount of ${discountValue}${discountType === 'PERCENT' ? '%' : currencySymbol}` : undefined
      };
      if (isRoomOrder) {
        payload.folioId = targetFolioId;
      }
      if (payments.length > 0) {
        payload.payments = payments;
      }

      if (navigator.onLine) {
        const res = await fetch(`/api/v1/pos/orders/${orderId}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 404) {
            await db.posOrders.delete(orderId);
            setSelectedOrder(null);
            await fetchOrders();
            showToast('Order was already settled or cleared on the server. Removing stale entry.', 'info', 'Order Cleared');
            return;
          }
          throw new Error(errData.message || `Checkout failed (${res.status})`);
        }
      } else {
        await db.syncQueue.add({
          url: `/api/v1/pos/orders/${orderId}/checkout`,
          method: 'POST',
          payload,
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0
        });
      }

      // Update local IndexedDB only upon success
      const order = await db.posOrders.get(orderId);
      if (order) {
        order.status = nextStatus;
        order.discountAmount = calculatedDiscount;
        await db.posOrders.put(order);
      }

      showToast(isRoomOrder ? 'Charged to Room Folio successfully' : 'Payment processed successfully', 'success', 'Paid');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Failed to process payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (effectiveRoles.length > 0 && !canSettle && effectiveRoles.some((r: any) => ['WAITSTAFF', 'STAFF_WAITER'].includes(r))) {
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
            <div className="stat-value">{format(Number(stats?.totalRevenue || 0))}</div>
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
        
        <h2>POS Cashier</h2>
      <p className="subtitle">Process payments for tables that have been served.</p>
      
      {/* Order Status Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setFilterTab('READY')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: filterTab === 'READY' ? '1px solid hsl(142, 76%, 36%)' : '1px solid hsl(217, 20%, 25%)',
            background: filterTab === 'READY' ? 'rgba(34, 197, 94, 0.2)' : 'hsl(222, 35%, 15%)',
            color: filterTab === 'READY' ? '#4ade80' : 'hsl(215, 20%, 65%)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Check size={14} /> Ready for Payment ({orders.filter(o => o.status === 'SERVED' || isOrderFullyServed(o)).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('PREPARING')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: filterTab === 'PREPARING' ? '1px solid hsl(38, 92%, 50%)' : '1px solid hsl(217, 20%, 25%)',
            background: filterTab === 'PREPARING' ? 'rgba(234, 179, 8, 0.2)' : 'hsl(222, 35%, 15%)',
            color: filterTab === 'PREPARING' ? '#facc15' : 'hsl(215, 20%, 65%)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Clock size={14} /> In Kitchen / Bar ({orders.filter(o => o.status !== 'SERVED' && !isOrderFullyServed(o)).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: filterTab === 'ALL' ? '1px solid hsl(215, 20%, 55%)' : '1px solid hsl(217, 20%, 25%)',
            background: filterTab === 'ALL' ? 'hsl(222, 35%, 25%)' : 'hsl(222, 35%, 15%)',
            color: filterTab === 'ALL' ? 'white' : 'hsl(215, 20%, 65%)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          All Active ({orders.length})
        </button>
      </div>

      <div className="cashier-content">
        <div className="orders-list">
          {(() => {
            const readyList = orders.filter(o => o.status === 'SERVED' || isOrderFullyServed(o));
            const preparingList = orders.filter(o => o.status !== 'SERVED' && !isOrderFullyServed(o));
            const displayed = filterTab === 'READY' ? readyList : (filterTab === 'PREPARING' ? preparingList : orders);
            
            if (displayed.length === 0) {
              return (
                <div className="no-orders">
                  {filterTab === 'READY' 
                    ? 'No tables waiting for payment. All active orders are currently being prepared or delivered.' 
                    : (filterTab === 'PREPARING' ? 'No orders currently in the kitchen or bar.' : 'No active orders.')}
                </div>
              );
            }

            return displayed.map(order => {
              const isServed = order.status === 'SERVED' || isOrderFullyServed(order);
              return (
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
                    <span className="amount">{format(Number(order.totalAmount))}</span>
                  </div>
                  {order.folio?.reservation?.guest && (
                    <p style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.85rem', marginTop: '-4px', marginBottom: '8px' }}>
                      {order.folio.reservation.guest.firstName} {order.folio.reservation.guest.lastName}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <p className="items-count" style={{ margin: 0 }}>{order.items?.length || 0} items</p>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      background: isServed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: isServed ? '#4ade80' : '#facc15',
                      border: isServed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)'
                    }}>
                      {isServed ? '✓ Ready to Pay' : '⏳ In Kitchen/Bar'}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
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

            {/* Preparation / Delivery Status Banner */}
            {!isOrderFullyServed(selectedOrder) ? (
              <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', color: '#facc15', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} />
                  <span>{selectedOrder.items?.length === 0 ? 'Empty Order (0 items)' : 'Order Not Fully Served Yet'}</span>
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#fef08a', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {selectedOrder.items?.length === 0
                    ? 'This order contains no items. You can safely discard or void it.'
                    : 'Items must be prepared by the kitchen or bar and delivered by the waitstaff before payment can be accepted.'}
                </p>
                {selectedOrder.items?.length === 0 && (
                  <button
                    onClick={() => handleVoidEmptyOrder(selectedOrder.id)}
                    style={{ marginTop: '10px', padding: '6px 14px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <X size={14} />
                    <span>Void & Remove Empty Order</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', color: '#4ade80', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} />
                <span>All items served to table. Ready for settlement.</span>
              </div>
            )}
            
            <div className="receipt">
                {selectedOrder.items.map((item: any) => {
                  const isReturned = item.status === 'RETURNED';
                  const isReturnRequested = item.status === 'RETURN_REQUESTED';
                  const isServed = item.status === 'SERVED' || item.status === 'DELIVERED';
                  const isReady = item.status === 'READY';
                  const isCooking = item.status === 'COOKING' || item.status === 'PREPARING';
                  return (
                  <div key={item.id} className={`receipt-item ${isReturned ? 'text-rose-400' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span className="qty" style={{ fontWeight: 'bold' }}>{item.quantity}x</span>
                      <span className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.menuItem.name}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontWeight: 600,
                        marginLeft: '4px',
                        whiteSpace: 'nowrap',
                        background: isReturned ? 'rgba(239, 68, 68, 0.2)' : isReturnRequested ? 'rgba(234, 179, 8, 0.2)' : isServed ? 'rgba(34, 197, 94, 0.2)' : isReady ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                        color: isReturned ? '#f87171' : isReturnRequested ? '#facc15' : isServed ? '#4ade80' : isReady ? '#60a5fa' : '#94a3b8'
                      }}>
                        {isReturned ? 'Returned' : isReturnRequested ? 'Return Pending' : isServed ? 'Served' : isReady ? 'Ready' : isCooking ? 'Cooking' : 'In Prep'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                      <span className="price" style={{ fontWeight: 600 }}>{isReturned ? format(0) : format(Number(item.menuItem.price) * item.quantity)}</span>
                      {isReturnRequested && canManageReturns && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInlineApproveReturn(item.id, true);
                            }}
                            style={{
                              background: '#16a34a',
                              color: 'white',
                              border: 'none',
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                            title="Approve return for this item"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInlineApproveReturn(item.id, false);
                            }}
                            style={{
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 700
                            }}
                            title="Reject return for this item"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {!isReturned && !isReturnRequested && selectedOrder.status !== 'PAID' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReturnModalItem({
                              id: item.id,
                              name: item.menuItem.name,
                              quantity: item.quantity,
                              price: item.menuItem.price,
                              tableOrRoom: selectedOrder.folio?.reservation?.room 
                                ? `Room ${selectedOrder.folio.reservation.room.number}` 
                                : selectedOrder.table?.number 
                                  ? `Table ${selectedOrder.table.number}` 
                                  : 'Walk-in'
                            });
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Request return for this item"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </div>
                )})}
              <div className="receipt-total" style={{ borderBottom: isDiscountApplied ? 'none' : '', paddingBottom: isDiscountApplied ? '4px' : '' }}>
                  <span>Subtotal</span>
                  <span>{format(Number(selectedOrder.totalAmount))}</span>
                </div>
                {isDiscountApplied && (
                  <div className="receipt-total" style={{ borderTop: 'none', paddingTop: '4px', marginTop: 0, color: 'hsl(142, 76%, 45%)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={15} /> Discount (Confirmed)
                    </span>
                    <span>-{format(calculatedDiscount)}</span>
                  </div>
                )}
                <div className="receipt-total" style={{ borderTop: isDiscountApplied ? 'none' : '' }}>
                  <span>Total Amount</span>
                  <span>{format(finalTotal)}</span>
                </div>
            </div>

            {/* Discount Management Card */}
            <div className="discount-box" style={{ background: 'hsl(222, 35%, 12%)', border: '1px solid hsl(217, 20%, 22%)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={16} color="hsl(43,96%,56%)" /> Discount Management
                </span>
                {isDiscountApplied ? (
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Confirmed & Saved
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'hsl(215, 20%, 65%)' }}>
                    Unconfirmed
                  </span>
                )}
              </div>

              {isDiscountApplied ? (
                <div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '6px', padding: '10px 12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#86efac', fontWeight: 600, fontSize: '0.875rem' }}>
                        Applied Discount: -{format(Number(selectedOrder.discountAmount))}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#bbf7d0' }}>
                        ({discountMeta?.type === 'PERCENT' ? `${discountMeta.value}%` : format(discountMeta?.value || selectedOrder.discountAmount)})
                      </span>
                    </div>
                    {discountMeta?.appliedRole && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'hsl(215, 20%, 65%)' }}>
                        Locked by: {discountMeta.appliedRole} {discountMeta.modifiedCount ? `(Revised ${discountMeta.modifiedCount}x)` : ''}
                      </p>
                    )}
                  </div>

                  {(() => {
                    const roles = getEffectiveRoles();
                    const isCeoOrAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'CEO'].includes(r));
                    const isManager = roles.includes('MANAGER');
                    const isCashierOnly = !isCeoOrAdmin && !isManager;

                    if (isCashierOnly) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                          <Lock size={14} />
                          <span>Discount is locked. Cashiers are not permitted to reverse or edit applied discounts.</span>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {isManager && !isCeoOrAdmin && (
                          <div style={{ fontSize: '0.78rem', color: discountModifiedCount >= 1 ? '#f87171' : '#facc15' }}>
                            {discountModifiedCount >= 1 
                              ? 'Manager modification limit reached (1/1). Only CEO/Admin can make further revisions.' 
                              : 'Manager Access: 1 revision remaining.'}
                          </div>
                        )}
                        {isCeoOrAdmin && (
                          <div style={{ fontSize: '0.78rem', color: '#4ade80' }}>
                            CEO/Admin Access: Unlimited discount revisions permitted.
                          </div>
                        )}

                        {(isCeoOrAdmin || (isManager && discountModifiedCount < 1)) && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={handleReverseDiscount}
                              disabled={isReversingDiscount}
                              style={{ flex: 1, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              {isReversingDiscount ? 'Reversing...' : 'Remove / Reverse Discount'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 2 }}>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="Discount value..."
                        value={discountValue} 
                        onChange={e => setDiscountValue(e.target.value)} 
                        style={{ width: '100%', padding: '9px 12px', background: 'hsl(222, 35%, 8%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', borderRadius: '6px', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select 
                        value={discountType} 
                        onChange={e => setDiscountType(e.target.value as 'PERCENT' | 'FLAT')}
                        style={{ width: '100%', padding: '9px 10px', background: 'hsl(222, 35%, 8%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', borderRadius: '6px', fontSize: '0.9rem' }}
                      >
                        <option value="PERCENT">%</option>
                        <option value="FLAT">{currencySymbol}</option>
                      </select>
                    </div>
                  </div>

                  {discountValue && parseFloat(discountValue) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(234, 179, 8, 0.1)', border: '1px dashed rgba(234, 179, 8, 0.3)', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.8rem', color: '#facc15' }}>
                      <span>Discount Preview:</span>
                      <span style={{ fontWeight: 700 }}>
                        -{format(discountType === 'PERCENT' ? (Number(selectedOrder.totalAmount) * (parseFloat(discountValue) / 100)) : parseFloat(discountValue))}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={isApplyingDiscount || !discountValue || parseFloat(discountValue) <= 0}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: (!discountValue || parseFloat(discountValue) <= 0) ? 'hsl(222, 35%, 20%)' : 'hsl(142, 76%, 36%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: (!discountValue || parseFloat(discountValue) <= 0) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle2 size={15} />
                    {isApplyingDiscount ? 'Applying & Locking...' : 'Apply & Confirm Discount'}
                  </button>
                </div>
              )}
            </div>
              {canSettle ? (<div className="payment-entry-section">
              {payments.length > 0 && (
                <div className="payments-list" style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: 'white', fontSize: '0.875rem', marginBottom: '8px', marginTop: 0 }}>Payments Added</h4>
                  {payments.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'hsl(222, 35%, 15%)', borderRadius: '4px', marginBottom: '4px' }}>
                      <span style={{ color: 'hsl(215, 20%, 65%)' }}>{p.method.replace('PAYMENT_', '')}</span>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 600 }}>{format(p.amount)}</span>
                        <button type="button" onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', color: 'hsl(0, 84%, 60%)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(217, 20%, 25%)' }}>
                    <span style={{ color: 'white', fontWeight: 600 }}>Remaining Balance:</span>
                    <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 700 }}>
                      {format(Math.max(0, finalTotal - payments.reduce((sum, p) => sum + p.amount, 0)))}
                    </span>
                  </div>
                </div>
              )}

              {payments.reduce((sum, p) => sum + p.amount, 0) < finalTotal && (
                <div className="payment-entry-form" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>Amount ({currencySymbol})</label>
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
              <button className="btn-secondary" onClick={() => handlePrintInvoice(selectedOrder.id)} title="Print or preview invoice">
                Print Invoice
              </button>
              <button className="btn-secondary" onClick={() => handlePrintReceipt(selectedOrder.id)} title="Print or preview receipt">
                Print Receipt
              </button>
              <button className="btn-secondary" onClick={() => downloadReceiptPdf(selectedOrder.id, true)} title="Download Invoice as PDF (best for mobile)">
                PDF Invoice
              </button>
              <button className="btn-secondary" onClick={() => downloadReceiptPdf(selectedOrder.id, false)} title="Download Receipt as PDF (best for mobile)">
                PDF Receipt
              </button>
              <button 
                className="btn-pay" 
                disabled={isProcessing || !isOrderFullyServed(selectedOrder) || (!Boolean(selectedOrder.folioId || selectedOrder.folio?.reservation?.room || selectedOrder.folio?.id) && payments.reduce((sum, p) => sum + p.amount, 0) < finalTotal - 0.01)} 
                onClick={() => handleCheckout(selectedOrder.id)}
              >
                {isProcessing 
                  ? 'Processing...' 
                  : !isOrderFullyServed(selectedOrder)
                    ? 'Awaiting Waitstaff Delivery'
                    : Boolean(selectedOrder.folioId || selectedOrder.folio?.reservation?.room || selectedOrder.folio?.id)
                      ? `Charge to Room Folio (${format(finalTotal)})`
                      : 'Complete Payment'}
              </button>
            </div>

            {/* DYNAMIC BRANDED RECEIPTS & INVOICES */}
            <div className="print-only-container">
              <div id="kwalee-receipt" className="kwalee-receipt">
                <div className="header-container">
                  {receiptSettings.showLogo && receiptSettings.logoUrl && (
                    <img src={receiptSettings.logoUrl} alt="Logo" style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'contain', marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                  )}
                  <div className="header-title">{receiptSettings.businessName}</div>
                  {receiptSettings.tagline && <div className="header-info" style={{ fontStyle: 'italic', marginBottom: '2px' }}>{receiptSettings.tagline}</div>}
                  {receiptSettings.website && <div className="header-info">{receiptSettings.website}</div>}
                  {receiptSettings.phone && <div className="header-info">{receiptSettings.phone}</div>}
                  {receiptSettings.address && <div className="header-info">{receiptSettings.address}</div>}
                  {receiptSettings.taxNumber && <div className="header-info" style={{ fontWeight: 'bold' }}>TIN: {receiptSettings.taxNumber}</div>}
                </div>
                
                <div className="divider"></div>
                <p className="sub">{receiptSettings.receipt.title}</p>
                
                <div className="meta"><span>RECEIPT NO</span> <span>#{receiptSettings.receipt.prefix}{selectedOrder.id.substring(0,8).toUpperCase()}</span></div>
                {receiptSettings.receipt.showTableNumber && (
                  <div className="meta"><span>LOCATION</span> <span>{selectedOrder.folio?.reservation?.room ? `Room ${selectedOrder.folio.reservation.room.number}` : selectedOrder.table?.number || 'Walk-in'}</span></div>
                )}
                <div className="meta"><span>DATE</span> <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span></div>
                {receiptSettings.receipt.showServerName && selectedOrder.user && (
                  <div className="meta"><span>CASHIER</span> <span>{selectedOrder.user.firstName} {selectedOrder.user.lastName}</span></div>
                )}
                
                <div className="divider"></div>
                
                {selectedOrder.items.map((item: any) => {
                  const isReturned = item.status === 'RETURNED';
                  const displayName = isReturned ? `(Returned) ${item.menuItem.name}` : item.menuItem.name;
                  const displayPrice = isReturned 
                    ? format(0)
                    : format(Number(item.menuItem.price) * item.quantity);
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: isReturned ? '#dc2626' : '#000' }}>
                      <div><span style={{ marginRight: '8px', color: '#000' }}>{item.quantity}x</span><span style={{ color: '#000' }}>{displayName}</span></div>
                      <span style={{ color: '#000' }}>{displayPrice}</span>
                    </div>
                  );
                })}
                
                <div className="divider"></div>
                
                <div className="summary-row"><span>Subtotal</span><span>{format(Number(selectedOrder.totalAmount))}</span></div>
                {receiptSettings.receipt.showTaxBreakdown && (
                  <div className="summary-row"><span style={{ fontSize: '11px', color: '#555' }}>GST / Tax Included (10%)</span><span style={{ fontSize: '11px', color: '#555' }}>{format((Number(selectedOrder.totalAmount)) - (Number(selectedOrder.totalAmount) / 1.10))}</span></div>
                )}
                {calculatedDiscount > 0 && <div className="summary-row" style={{ color: '#dc2626' }}><span>Discount</span><span>-{format(calculatedDiscount)}</span></div>}
                <div className="totals"><span>TOTAL</span><span>{format(finalTotal)}</span></div>
                
                {receiptSettings.receipt.footerNote && (
                  <div className="footer">
                    <p style={{ whiteSpace: 'pre-line' }}>{receiptSettings.receipt.footerNote}</p>
                    {receiptSettings.receipt.showServerName && (
                      <p>Served by: {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'Staff'}</p>
                    )}
                  </div>
                )}
                
                {receiptSettings.receipt.terms && (
                  <div className="footer-terms">
                    <strong>TERMS & CONDITIONS:</strong><br/>
                    <span style={{ whiteSpace: 'pre-line' }}>{receiptSettings.receipt.terms}</span>
                  </div>
                )}
              </div>

              <div id="kwalee-invoice" className="kwalee-receipt">
                <div className="header-container">
                  {receiptSettings.showLogo && receiptSettings.logoUrl && (
                    <img src={receiptSettings.logoUrl} alt="Logo" style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'contain', marginBottom: '8px', display: 'block', margin: '0 auto' }} />
                  )}
                  <div className="header-title">{receiptSettings.businessName}</div>
                  {receiptSettings.tagline && <div className="header-info" style={{ fontStyle: 'italic', marginBottom: '2px' }}>{receiptSettings.tagline}</div>}
                  {receiptSettings.website && <div className="header-info">{receiptSettings.website}</div>}
                  {receiptSettings.phone && <div className="header-info">{receiptSettings.phone}</div>}
                  {receiptSettings.address && <div className="header-info">{receiptSettings.address}</div>}
                  {receiptSettings.taxNumber && <div className="header-info" style={{ fontWeight: 'bold' }}>TIN: {receiptSettings.taxNumber}</div>}
                </div>
                
                <div className="divider"></div>
                <p className="sub">{receiptSettings.invoice.title}</p>
                
                <div className="meta"><span>INVOICE NO</span> <span>#{receiptSettings.invoice.prefix}{selectedOrder.id.substring(0,8).toUpperCase()}</span></div>
                <div className="meta"><span>LOCATION</span> <span>{selectedOrder.folio?.reservation?.room ? `Room ${selectedOrder.folio.reservation.room.number}` : selectedOrder.table?.number || 'Walk-in'}</span></div>
                <div className="meta"><span>DATE</span> <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span></div>
                
                <div className="divider"></div>
                
                {selectedOrder.items.map((item: any) => {
                  const isReturned = item.status === 'RETURNED';
                  const displayName = isReturned ? `(Returned) ${item.menuItem.name}` : item.menuItem.name;
                  const displayPrice = isReturned 
                    ? format(0)
                    : format(Number(item.menuItem.price) * item.quantity);
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: isReturned ? '#dc2626' : '#000' }}>
                      <div><span style={{ marginRight: '8px', color: '#000' }}>{item.quantity}x</span><span style={{ color: '#000' }}>{displayName}</span></div>
                      <span style={{ color: '#000' }}>{displayPrice}</span>
                    </div>
                  );
                })}
                
                <div className="divider"></div>
                
                <div className="summary-row"><span>Subtotal</span><span>{format(Number(selectedOrder.totalAmount))}</span></div>
                <div className="summary-row"><span style={{ fontSize: '11px', color: '#555' }}>GST / Tax Included (10%)</span><span style={{ fontSize: '11px', color: '#555' }}>{format((Number(selectedOrder.totalAmount)) - (Number(selectedOrder.totalAmount) / 1.10))}</span></div>
                {calculatedDiscount > 0 && <div className="summary-row" style={{ color: '#dc2626' }}><span>Discount</span><span>-{format(calculatedDiscount)}</span></div>}
                <div className="totals"><span>TOTAL</span><span>{format(finalTotal)}</span></div>
                
                {receiptSettings.invoice.showSignatureLine && (
                  <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto 8px auto' }}></div>
                    <p style={{ fontSize: '12px', margin: 0, color: '#000' }}>Customer Signature</p>
                  </div>
                )}

                {receiptSettings.invoice.footerNote && (
                  <div className="footer">
                    <p style={{ whiteSpace: 'pre-line' }}>{receiptSettings.invoice.footerNote}</p>
                    <p>Served by: {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : 'Staff'}</p>
                  </div>
                )}
                
                {receiptSettings.invoice.terms && (
                  <div className="footer-terms">
                    <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
                    <span style={{ whiteSpace: 'pre-line' }}>{receiptSettings.invoice.terms}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ReturnItemModal
        isOpen={!!returnModalItem}
        item={returnModalItem}
        onClose={() => setReturnModalItem(null)}
        onSubmit={handleReturnSubmit}
        isSubmitting={isSubmittingReturn}
      />

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

