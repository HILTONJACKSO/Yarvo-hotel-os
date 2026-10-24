"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncOfflineMutations, downloadLatestData } from '@/lib/sync';
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/lib/auth-provider";
import { useCurrency } from "@/lib/currency";
import { getDefaultReceiptInvoiceSettings } from "@/lib/receipt-invoice-helper";
import { ShoppingCart, Edit, Trash2, Receipt } from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();
  const { format, currencySymbol } = useCurrency();
  const property = useLiveQuery(() => db.properties.toCollection().first());
  const receiptSettings = getDefaultReceiptInvoiceSettings(property);
  const hotelName = receiptSettings.businessName;
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDeleteFolioModalOpen, setIsDeleteFolioModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('ROOM');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const { showToast } = useToast();
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBillType, setSelectedBillType] = useState<"FOLIO" | "POS_ORDER" | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived selectedBill - eliminates circular object reference re-renders
  const selectedBill = bills.find(b => b.id === selectedBillId && b.type === selectedBillType) || null;

  // Form states for Folio
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeCategory, setChargeCategory] = useState("ROOM");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PAYMENT_CARD");

  // Top Bar Stats
  const [totalPendingPOS, setTotalPendingPOS] = useState(0);
  const [totalPendingRooms, setTotalPendingRooms] = useState(0);

  const fetchBills = async () => {
    try {
      if (navigator.onLine) await downloadLatestData();
      
      const folios = (await db.folios.toArray()).filter((f: any) => f.status === 'OPEN').map((f: any) => ({ ...f, type: "FOLIO" }));
      const allPos = await db.posOrders.toArray();
      const invoicedPos = allPos.filter((o: any) => o.status === "SERVED" || o.status === "OPEN");
      const posOrders = invoicedPos.map((o: any) => ({ ...o, type: "POS_ORDER" }));

      const totalPosAmount = posOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      setTotalPendingPOS(totalPosAmount);
      const totalRoomsAmount = folios.reduce((sum: number, f: any) => sum + Number(f.balance || 0), 0);
      setTotalPendingRooms(totalRoomsAmount);

      // Deterministic stable sorting
      const allBills = [...folios, ...posOrders].sort((a, b) => {
        const timeDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (timeDiff !== 0) return timeDiff;
        return String(a.id).localeCompare(String(b.id));
      });
      setBills(allBills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const printViaIframe = (mode: 'RECEIPT' | 'INVOICE' = 'INVOICE') => {
    if (!selectedBill) return;
    const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    let itemsHtml = '';
    let totalCharges = 0;
    let totalDiscounts = 0;
    let totalPayments = 0;
    
    (selectedBill.lineItems || []).forEach((item: any) => {
      const amt = Number(item.amount);
      if (item.type === 'CHARGE') totalCharges += amt;
      if (item.type === 'ADJUSTMENT') totalDiscounts += Math.abs(amt);
      if (item.type === 'PAYMENT') totalPayments += Math.abs(amt);
      const isSub = (item.type === 'PAYMENT' || item.type === 'ADJUSTMENT' || amt < 0);
      const displayAmt = isSub ? `-${format(Math.abs(amt))}` : format(Math.abs(amt));
      itemsHtml += `
        <div class="summary-row" style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; font-family:monospace; color:#000;">
          <span style="flex:1;">${new Date(item.createdAt).toLocaleDateString()} ${item.description.substring(0, 20)}</span>
          <span style="font-weight:500;">${displayAmt}</span>
        </div>
      `;
    });

    const gst = totalCharges - (totalCharges / 1.10);
    const bal = (selectedBill?.balance || 0);

    const docHtml = `
      <html><head><title>Bill ${mode}</title></head>
      <body style="margin:0; padding:20px; font-family:'Courier New', Courier, monospace; color:#000; background:#fff; max-width: 380px; margin: 0 auto;">
        <div style="text-align:center; margin-bottom:20px;">
          ${receiptSettings.showLogo && receiptSettings.logoUrl ? `<img src="${receiptSettings.logoUrl}" style="max-width:120px; max-height:60px; object-fit:contain; margin-bottom:10px; display:block; margin:0 auto 10px auto;" />` : ''}
          <div style="font-size:20px; font-weight:bold; margin-bottom:4px; color:#000;">${receiptSettings.businessName}</div>
          ${receiptSettings.tagline ? `<div style="font-size:12px; font-style:italic; color:#444; margin-bottom:4px;">${receiptSettings.tagline}</div>` : ''}
          ${receiptSettings.website ? `<div style="font-size:12px; color:#000;">${receiptSettings.website}</div>` : ''}
          ${receiptSettings.email ? `<div style="font-size:12px; color:#000;">${receiptSettings.email}</div>` : ''}
          ${receiptSettings.phone ? `<div style="font-size:12px; color:#000;">${receiptSettings.phone}</div>` : ''}
          ${receiptSettings.address ? `<div style="font-size:12px; color:#000;">${receiptSettings.address}</div>` : ''}
          ${receiptSettings.taxNumber ? `<div style="font-size:12px; font-weight:bold; color:#000;">TIN: ${receiptSettings.taxNumber}</div>` : ''}
        </div>
        <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">
          ${mode === 'RECEIPT' ? receiptSettings.receipt.title : receiptSettings.invoice.title}
        </div>
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Invoice No:</span><span>${mode === 'RECEIPT' ? receiptSettings.receipt.prefix : receiptSettings.invoice.prefix}${selectedBill.id.substring(0,6).toUpperCase()}</span>
        </div>
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Date:</span><span>${new Date().toLocaleDateString()}</span>
        </div>
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Guest:</span><span>${selectedBill.reservation?.guest?.firstName || ''} ${selectedBill.reservation?.guest?.lastName || ''}</span>
        </div>
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Room:</span><span>${selectedBill.reservation?.room?.number || 'N/A'}</span>
        </div>
        
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        ${itemsHtml}
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span>Subtotal (Charges)</span><span>${format(totalCharges)}</span>
        </div>
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span style="color:#555;">GST Included (10%)</span><span style="color:#555;">${format(gst)}</span>
        </div>
        ${totalDiscounts > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#dc2626;">
          <span>Total Discounts</span><span>-${format(totalDiscounts)}</span>
        </div>` : ''}
        ${totalPayments > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#059669;">
          <span>Total Payments</span><span>-${format(totalPayments)}</span>
        </div>` : ''}
        
        <div style="font-size:18px; font-weight:bold; display:flex; justify-content:space-between; margin-top:12px; color:#000;">
          <span>BALANCE DUE</span><span>${format(Number(bal))}</span>
        </div>

        ${mode === 'INVOICE' && receiptSettings.invoice.showSignatureLine ? `
        <div style="margin-top:50px; text-align:center;">
          <div style="border-top:1px solid #000; width:200px; margin:0 auto 8px auto;"></div>
          <p style="font-size:12px; margin:0; color:#000;">Guest Signature</p>
        </div>
        ` : ''}
        
        <div style="text-align:center; font-size:11px; margin-top:40px; color:#333; line-height:1.5;">
          <p style="color:#000; margin:0; white-space:pre-line;">${mode === 'RECEIPT' ? receiptSettings.receipt.footerNote : receiptSettings.invoice.footerNote}</p>
        </div>
        
        ${(mode === 'RECEIPT' ? receiptSettings.receipt.terms : receiptSettings.invoice.terms) ? `
        <div style="text-align:left; font-size:10px; margin-top:20px; color:#000; line-height:1.4; border-top:1px dashed #000; padding-top:10px;">
          <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
          <span style="white-space:pre-line;">${mode === 'RECEIPT' ? receiptSettings.receipt.terms : receiptSettings.invoice.terms}</span>
        </div>` : ''}
      </body>
      </html>
    `;

    doc.open();
    doc.write(docHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); }, 1000);
    }, 250);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const selectFolio = async (id: string) => {
    try {
      if (navigator.onLine) {
        const res = await fetch(`/api/v1/folios/${id}/statement`);
        if (res.ok) {
          const json = await res.json();
          const folioData = json.data || json;
          if (folioData?.id) {
            await db.folios.put(folioData);
            setBills(prev => prev.map(b => (b.id === id && b.type === "FOLIO") ? { ...folioData, type: "FOLIO" } : b));
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectBill = (b: any) => {
    setSelectedBillId(b.id);
    setSelectedBillType(b.type);
    if (b.type === "FOLIO") {
      selectFolio(b.id);
    }
  };

  // Folio Actions

  const handleCloseFolio = () => setIsCloseModalOpen(true);

  const confirmCloseFolio = async () => {
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/close`, { method: "POST" });
      if (res.ok) {
        showToast("Folio closed successfully!", "success");
        await db.folios.delete(selectedBill.id);
        setSelectedBillId(null);
        setSelectedBillType(null);
        fetchBills();
        setIsCloseModalOpen(false);
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to close folio", "error");
        setIsCloseModalOpen(false);
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      setIsCloseModalOpen(false);
    }
  };

  const confirmDeleteFolio = async () => {
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) {
        showToast("Room bill deleted successfully!", "success");
        await db.folios.delete(selectedBill.id);
        setSelectedBillId(null);
        setSelectedBillType(null);
        setIsDeleteFolioModalOpen(false);
        fetchBills();
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.message || "Failed to delete room bill", "error");
        setIsDeleteFolioModalOpen(false);
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      setIsDeleteFolioModalOpen(false);
    }
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setEditAmount(String(Math.abs(Number(item.amount))));
    setEditDesc(item.description || '');
    setEditCategory(item.category || 'ROOM');
    setIsEditModalOpen(true);
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !editingItem) return;
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Please enter an amount greater than 0", "error");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          description: editDesc,
          category: editCategory,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const updatedFolio = json.data || json;
        if (updatedFolio?.id) {
          await db.folios.put(updatedFolio);
          setBills(prev => prev.map(b => (b.id === updatedFolio.id && b.type === "FOLIO") ? { ...updatedFolio, type: "FOLIO" } : b));
        }
        showToast("Line item updated successfully!", "success");
        setIsEditModalOpen(false);
        setEditingItem(null);
        selectFolio(selectedBill.id);
        fetchBills();
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.message || "Failed to update item", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteLineItem = async (itemId: string) => {
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    if (!window.confirm("Are you sure you want to delete this line item? The bill balance will be automatically recalculated.")) return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const json = await res.json();
        const updatedFolio = json.data || json;
        if (updatedFolio?.id) {
          await db.folios.put(updatedFolio);
          setBills(prev => prev.map(b => (b.id === updatedFolio.id && b.type === "FOLIO") ? { ...updatedFolio, type: "FOLIO" } : b));
        }
        showToast("Line item deleted and balance updated!", "success");
        selectFolio(selectedBill.id);
        fetchBills();
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.message || "Failed to delete line item", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    }
  };


  const handlePostDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(discountAmount), description: discountDescription || "Discount", category: "OTHER" }),
      });
      if (res.ok) {
        showToast("Discount posted successfully!", "success");
        setDiscountAmount("");
        setDiscountDescription("");
        selectFolio(selectedBill.id);
        fetchBills();
      } else {
        const error = await res.json();
        showToast(error.message || "Failed to post discount", "error");
      }
    } catch (error) {
      showToast("Network error.", "error");
    }
  };

  const handlePostCharge = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/charges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(chargeAmount), description: chargeDesc, category: chargeCategory }),
      });
      if (res.ok) {
        showToast("Charge posted successfully!", "success", "Success");
        setChargeAmount(""); setChargeDesc("");
        fetchBills();
      } else {
        const error = await res.json();
        showToast(`Failed: ${error.message}`, "error", "Error");
      }
    } catch (err) { console.error(err); }
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || selectedBill.type !== "FOLIO") return;
    try {
      const res = await fetch(`/api/v1/folios/${selectedBill.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(paymentAmount), description: `Payment - ${paymentMethod.replace('PAYMENT_', '')}`, category: paymentMethod }),
      });
      if (res.ok) {
        showToast("Payment posted successfully!", "success", "Success");
        setPaymentAmount("");
        fetchBills();
      } else {
        const error = await res.json();
        showToast(`Failed: ${error.message}`, "error", "Error");
      }
    } catch (err) { console.error(err); }
  };

  // POS Actions
  const handleCheckoutPOS = async () => {
    if (!selectedBill || selectedBill.type !== "POS_ORDER") return;
    try {
      const res = await fetch(`/api/v1/pos/orders/${selectedBill.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments: [{ method: paymentMethod || "PAYMENT_CASH", amount: Number(selectedBill.totalAmount) }] })
      });
      if (res.ok) {
        showToast("Order checked out successfully!", "success");
        await db.posOrders.delete(selectedBill.id);
        setSelectedBillId(null);
        setSelectedBillType(null);
        fetchBills();
      } else {
        const error = await res.json().catch(() => ({ message: 'Checkout failed' }));
        if (res.status === 404 || error.message?.includes('not found')) {
          showToast("Order not found on server. Removing stale order.", "error");
          await db.posOrders.delete(selectedBill.id);
          setSelectedBillId(null);
          setSelectedBillType(null);
          fetchBills();
        } else {
          showToast(`Failed: ${error.message}`, "error");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Checkout failed", "error");
    }
  };

  const handleDeletePOS = async () => {
    if (!selectedBill || selectedBill.type !== "POS_ORDER") return;
    if (!confirm("Are you sure you want to delete this POS order? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/pos/orders/${selectedBill.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 404) {
        await db.posOrders.delete(selectedBill.id);
        showToast("POS Order deleted successfully.", "success");
        setSelectedBillId(null);
        setSelectedBillType(null);
        fetchBills();
      } else {
        const error = await res.json().catch(() => ({ message: 'Failed to delete' }));
        showToast(error.message || "Failed to delete order.", "error");
      }
    } catch (err: any) {
      console.error(err);
      await db.posOrders.delete(selectedBill.id);
      setSelectedBillId(null);
      setSelectedBillType(null);
      showToast("POS Order removed locally.", "success");
      fetchBills();
    }
  };

  const isAdmin = user?.roles?.some((r: any) => ["SUPER_ADMIN", "ADMIN", "CEO"].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
  const isCashierOrManager = user?.roles?.some((r: any) => ["CASHIER", "MANAGER", "SUPER_ADMIN", "ADMIN", "CEO"].includes(r.name?.toUpperCase() || r.toUpperCase() || r));
  const isFrontDesk = user?.roles?.some((r: any) => ["FRONT_DESK"].includes(r.name?.toUpperCase() || r.toUpperCase() || r));

  if (loading && bills.length === 0) return <div className="flex items-center justify-center h-full text-slate-400">Loading Billing...</div>;

  return (
    <div className="flex flex-col h-full gap-6 pb-10">
      {/* Top Bar Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute -right-6 -top-6 text-cyan-500/10 group-hover:text-cyan-500/20 transition-all duration-500"><Receipt size={120} /></div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-2 relative z-10 uppercase">Pending Rooms Billing</h3>
            <p className="text-4xl font-extrabold text-white relative z-10 tracking-tight">{format(totalPendingRooms)}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute -right-6 -top-6 text-cyan-500/10 group-hover:text-cyan-500/20 transition-all duration-500"><Receipt size={120} /></div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-2 relative z-10 uppercase">Pending F&B Billing</h3>
            <p className="text-4xl font-extrabold text-white relative z-10 tracking-tight">{format(totalPendingPOS)}</p>
          </div>
        </div>

      <div className="flex flex-1 gap-6 min-h-0 items-start">
        {/* Sidebar: List of Bills */}
        <div className="w-[320px] bg-slate-800/80 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-2xl flex flex-col shrink-0 sticky top-[80px] max-h-[calc(100vh-100px)] overflow-hidden">
          <div className="p-5 border-b border-slate-700/60 bg-slate-900/40">
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">Active Bills</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Receipt size={32} className="mb-3 opacity-40" />
                <p className="text-sm font-medium">No active bills found.</p>
              </div>
            ) : (
              bills.map(b => (
                <div 
                  key={b.id} 
                  className={`bg-slate-900/60 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${(selectedBillId === b.id && selectedBillType === b.type) ? 'border-cyan-500 bg-cyan-950/30 shadow-cyan-900/20' : 'border-slate-700/50 hover:border-slate-600'}`}
                  onClick={() => handleSelectBill(b)}
                >
                  {b.type === 'FOLIO' ? (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-200 text-sm">Bill: {b.reservation?.guest?.lastName}</span>
                        <span className={`font-bold ${b.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{format(Number(b.balance))}</span>
                      </div>
                      <div className="text-xs text-slate-400">Room {b.reservation?.room?.number || 'N/A'}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-200 text-sm">POS: {b.table?.number ? `Table ${b.table.number}` : 'Walk-in'}</span>
                        <span className="font-bold text-rose-400">{format(Number(b.totalAmount))}</span>
                      </div>
                      <div className="text-xs text-slate-400">{b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : 'Guest'} • {b.items?.length || 0} items</div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Area: Details & Actions */}
        <div className="flex-1 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 shadow-xl rounded-2xl flex flex-col overflow-hidden">
          {!selectedBill ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20">
              <div className="bg-slate-800/50 p-6 rounded-full mb-6 border border-slate-700/50">
                <Receipt size={48} className="opacity-40" />
              </div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">No Bill Selected</h3>
              <p className="text-slate-500">Select an active bill from the left to view details and process payments.</p>
            </div>
          ) : selectedBill.type === 'FOLIO' ? (
            // FOLIO RENDER
            <>
              <div className="p-8 border-b border-slate-700/60 bg-gradient-to-r from-slate-900/40 to-slate-800/40 flex justify-between items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 mb-3 uppercase tracking-wider">
                    {selectedBill.status}
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Bill: {selectedBill.reservation?.guest?.lastName}</h2>
                  <div className="text-slate-400 font-medium">Room {selectedBill.reservation?.room?.number || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Balance Due</div>
                  <div className={`text-3xl font-bold ${selectedBill.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {format(Number(selectedBill.balance))}
                  </div>
                  <div className="flex gap-2 justify-end mt-2 flex-wrap">
                      {selectedBill.status === 'OPEN' && (
                          <button onClick={handleCloseFolio} disabled={Number(selectedBill.balance) !== 0} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${Number(selectedBill.balance) === 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>Close Bill</button>
                        )}
                        <button onClick={() => printViaIframe('INVOICE')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>
                        <button onClick={() => printViaIframe('RECEIPT')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Receipt</button>
                        {(isAdmin || isCashierOrManager || isFrontDesk) && (
                          <button onClick={() => setIsDeleteFolioModalOpen(true)} className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                            <Trash2 size={13} /> Delete Bill
                          </button>
                        )}
                    </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-200 mb-4">Ledger Entries</h3>
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3 border-b border-slate-700">Date</th>
                        <th className="p-3 border-b border-slate-700">Category</th>
                        <th className="p-3 border-b border-slate-700">Description</th>
                        <th className="p-3 border-b border-slate-700 text-right">Charge</th>
                        <th className="p-3 border-b border-slate-700 text-right">Credit / Payment</th>
                        <th className="p-3 border-b border-slate-700 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {selectedBill.lineItems?.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-slate-500">No transactions found.</td></tr>
                      ) : (
                        selectedBill.lineItems?.map((item: any) => {
                          const isAdjustment = item.type === 'ADJUSTMENT';
                          const isPayment = item.type === 'PAYMENT';
                          const isCharge = item.type === 'CHARGE';
                          return (
                            <tr key={item.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                              <td className="p-3">{item.category?.replace('_', ' ')}</td>
                              <td className="p-3">
                                {item.description}
                                {isAdjustment && (
                                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-wide">
                                    Discount
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right text-rose-400 font-mono">
                                {isCharge ? format(Math.abs(Number(item.amount))) : ''}
                              </td>
                              <td className="p-3 text-right font-mono">
                                {isPayment && (
                                  <span className="text-emerald-400">-{format(Math.abs(Number(item.amount)))}</span>
                                )}
                                {isAdjustment && (
                                  <span className="text-amber-400">-{format(Math.abs(Number(item.amount)))}</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    title="Edit Item (amount, description)"
                                    onClick={() => handleOpenEditModal(item)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 transition-all"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete Item"
                                    onClick={() => handleDeleteLineItem(item.id)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedBill.status === 'OPEN' && (
                <div className="p-6 border-t border-slate-700 bg-slate-900/50 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  <form onSubmit={handlePostCharge} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                    <h4 className="font-bold text-slate-200">Post Charge</h4>
                    <select value={chargeCategory} onChange={(e) => setChargeCategory(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none">
                      <option value="ROOM">Room Rate</option><option value="F_AND_B">Food & Beverage</option><option value="LAUNDRY">Laundry</option><option value="SPA">Spa</option><option value="TOUR">Tour</option><option value="EVENT">Event</option><option value="PACKAGE">Package</option><option value="ACTIVITY">Activity</option><option value="TAX">GST / Tax</option><option value="OTHER">Other</option>
                    </select>
                    <input type="text" placeholder="Description" required value={chargeDesc} onChange={e => setChargeDesc(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                    <input type="number" step="0.01" min="0.01" placeholder={`Amount (${currencySymbol})`} required value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                    <button type="submit" className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 p-2.5 rounded-lg font-bold transition-all">Add Charge</button>
                  </form>
                  { (isCashierOrManager || isFrontDesk) && (
                      <>
                    <form onSubmit={handlePostDiscount} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Discount</h4>
                      <input type="text" placeholder="Description (e.g. Service Apology)" value={discountDescription} onChange={e => setDiscountDescription(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-cyan-500" required />
                      <input type="number" step="0.01" min="0.01" placeholder={`Amount (${currencySymbol})`} value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-cyan-500" required />
                      <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-auto shadow-lg shadow-amber-900/20">Add Discount</button>
                    </form>
                    <form onSubmit={handlePostPayment} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Payment</h4>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none">
                        <option value="PAYMENT_CARD">Credit Card</option>
                        <option value="PAYMENT_CASH">Cash</option>
                        <option value="PAYMENT_MOBILE">Mobile Money</option>
                        <option value="PAYMENT_BANK">Bank Transfer</option>
                      </select>
                      <input type="number" step="0.01" min="0.01" placeholder={`Amount (${currencySymbol})`} required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                      <button type="submit" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 p-2.5 rounded-lg font-bold transition-all">Add Payment</button>
                    </form>
                  </>
)}
                </div>
              )}
            </>
          ) : (
            // POS ORDER RENDER
            <>
              <div className="p-8 border-b border-slate-700/60 bg-gradient-to-r from-slate-900/40 to-slate-800/40 flex justify-between items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 mb-3 uppercase tracking-wider">
                    {selectedBill.table?.number ? `Table ${selectedBill.table.number}` : 'Walk-in'}
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">POS Order #{selectedBill.id.substring(0,8).toUpperCase()}</h2>
                  <div className="text-slate-400 font-medium">Printed: {selectedBill.invoicePrintCount} times</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Balance Due</div>
                  <div className="text-4xl font-extrabold text-rose-400 tracking-tight">{format(Number(selectedBill.totalAmount))}</div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-200 mb-4">Order Items</h3>
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3 border-b border-slate-700">Qty</th>
                        <th className="p-3 border-b border-slate-700">Item Name</th>
                        <th className="p-3 border-b border-slate-700 text-right">Price</th>
                        <th className="p-3 border-b border-slate-700 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {selectedBill.items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-slate-700/50 last:border-0">
                          <td className="p-3">{item.quantity}x</td>
                          <td className="p-3">{item.menuItem?.name}</td>
                          <td className="p-3 text-right font-mono">{format(Number(item.menuItem?.price))}</td>
                          <td className="p-3 text-right font-mono font-bold">{format(Number(item.menuItem?.price) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex gap-4 justify-end">
                {(isAdmin || isCashierOrManager) && (
                  <button onClick={handleDeletePOS} className="bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 mr-auto">
                    <Trash2 size={18} /> Delete POS Order
                  </button>
                )}
                {isCashierOrManager && (
                  <>
                      <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="PAYMENT_CASH">Cash</option>
                        <option value="PAYMENT_CARD">Credit Card</option>
                        <option value="PAYMENT_MOBILE">Mobile Money</option>
                        <option value="PAYMENT_BANK">Bank Transfer</option>
                      </select>
                    <button onClick={handleCheckoutPOS} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                      Checkout / Pay {format(Number(selectedBill.totalAmount))}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {/* Close Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-7 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><Receipt size={24} className="text-emerald-400" /> Close Bill</h3>
            <p className="text-slate-300 mb-6 text-sm">Are you sure you want to close this bill? This action cannot be undone, and no further charges or payments can be posted.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCloseModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmCloseFolio} className="px-4 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-lg shadow-emerald-900/30">Yes, Close Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Line Item Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-7 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Edit size={20} className="text-cyan-400" /> Edit {editingItem.type === 'ADJUSTMENT' ? 'Discount' : editingItem.type === 'PAYMENT' ? 'Payment' : 'Charge'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Modify the entry details or amount. The room bill balance will automatically recalculate.
            </p>
            <form onSubmit={handleSaveEditItem} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-cyan-500 text-sm"
                  placeholder="e.g. Room Charge, Discount, Payment"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-cyan-500 text-sm font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-cyan-500 text-sm"
                >
                  <option value="ROOM">Room Rate</option>
                  <option value="F_AND_B">Food & Beverage</option>
                  <option value="LAUNDRY">Laundry</option>
                  <option value="SPA">Spa</option>
                  <option value="TOUR">Tour</option>
                  <option value="EVENT">Event</option>
                  <option value="PACKAGE">Package</option>
                  <option value="ACTIVITY">Activity</option>
                  <option value="TAX">GST / Tax</option>
                  <option value="PAYMENT_CASH">Payment - Cash</option>
                  <option value="PAYMENT_CARD">Payment - Card</option>
                  <option value="PAYMENT_MOBILE">Payment - Mobile Money</option>
                  <option value="PAYMENT_BANK">Payment - Bank Transfer</option>
                  <option value="OTHER">Other / Discount</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors shadow-lg shadow-cyan-900/30 flex items-center gap-2"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folio Modal */}
      {isDeleteFolioModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-7 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 text-rose-400">
              <Trash2 size={22} /> Delete Room Bill
            </h3>
            <p className="text-slate-300 mb-6 text-sm">
              Are you sure you want to delete the bill for <strong className="text-white">{selectedBill.reservation?.guest?.lastName}</strong> (Room {selectedBill.reservation?.room?.number || 'N/A'})? This will remove all associated ledger items and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteFolioModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFolio}
                className="px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-lg shadow-rose-900/30"
              >
                Yes, Delete Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
