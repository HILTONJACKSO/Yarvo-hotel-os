"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/lib/auth-provider";
import { ShoppingCart, Edit, Trash2, Receipt } from "lucide-react";

export default function BillingPage() {
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountDescription, setDiscountDescription] = useState('');
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
      // Fetch open folios
      const resFolios = await fetch("/api/v1/folios?status=OPEN");
      if (!resFolios.ok) throw new Error("Failed to fetch folios");
      const jsonFolios = await resFolios.json();
      const folios = (jsonFolios.data || []).map((f: any) => ({ ...f, type: "FOLIO" }));

      // Fetch POS served orders
      const resPos = await fetch("/api/v1/pos/served-orders");
      if (!resPos.ok) throw new Error("Failed to fetch pos orders");
      const jsonPos = await resPos.json();
      const allPos = jsonPos.data || [];
      
      // Filter POS: We now show all active OPEN and SERVED orders immediately
      const invoicedPos = allPos.filter((o: any) => o.status === "SERVED" || o.status === "OPEN");
      const posOrders = invoicedPos.map((o: any) => ({ ...o, type: "POS_ORDER" }));

      // Calculate total pending POS
      const totalPosAmount = posOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      setTotalPendingPOS(totalPosAmount);
      const totalRoomsAmount = folios.reduce((sum: number, f: any) => sum + Number(f.balance || 0), 0);
      setTotalPendingRooms(totalRoomsAmount);

      // Combine
      setBills([...folios, ...posOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      // Refresh selected bill if exists
      if (selectedBill) {
        if (selectedBill.type === "FOLIO") {
           selectFolio(selectedBill.id, false);
        } else {
           const updatedPos = posOrders.find((o: any) => o.id === selectedBill.id);
           if (updatedPos) setSelectedBill(updatedPos);
           else setSelectedBill(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const printViaIframe = (mode: 'RECEIPT' | 'INVOICE' = 'INVOICE') => {
    if (!selectedBill) return;
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
    let totalCharges = 0;
    let totalDiscounts = 0;
    let totalPayments = 0;
    
    (selectedBill.lineItems || []).forEach((item: any) => {
      const amt = Number(item.amount);
      if (item.type === 'CHARGE') totalCharges += amt;
      if (item.type === 'ADJUSTMENT') totalDiscounts += Math.abs(amt);
      if (item.type === 'PAYMENT') totalPayments += Math.abs(amt);
      const isSub = (item.type === 'PAYMENT' || item.type === 'ADJUSTMENT' || amt < 0);
      const displayAmt = isSub ? `-$${Math.abs(amt).toFixed(2)}` : `$${Math.abs(amt).toFixed(2)}`;
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
          <img src="/kwalee-logo.png" style="max-width:120px; margin-bottom:10px;" />
          <div style="font-size:20px; font-weight:bold; margin-bottom:4px; color:#000;">KWALEE BEACH RESORT</div>
          <div style="font-size:12px; color:#000;">www.kwaleebeachresort.com</div>
          <div style="font-size:12px; color:#000;">info@kwaleebeachresort.com</div>
          <div style="font-size:12px; color:#000;">+231 774 340 843 / +231 881 774 350</div>
          <div style="font-size:12px; color:#000;">Kpakpa Kon, Marshall, Lower Margibi County, Liberia</div>
        </div>
        <div style="text-align:center; font-size:14px; font-weight:bold; margin:20px 0; color:#000;">${mode === 'RECEIPT' ? 'ROOM RECEIPT' : 'ROOM INVOICE'}</div>
        <div style="border-bottom:1px dashed #000; margin:12px 0;"></div>
        
        <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; color:#000;">
          <span style="color:#666;">Invoice No:</span><span>FL-${selectedBill.id.substring(0,6).toUpperCase()}</span>
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
          <span>Subtotal (Charges)</span><span>$${totalCharges.toFixed(2)}</span>
        </div>
        <div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#000;">
          <span style="color:#555;">GST Included (10%)</span><span style="color:#555;">$${gst.toFixed(2)}</span>
        </div>
        ${totalDiscounts > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#dc2626;">
          <span>Total Discounts</span><span>-$${totalDiscounts.toFixed(2)}</span>
        </div>` : ''}
        ${totalPayments > 0 ? `<div style="font-size:12px; display:flex; justify-content:space-between; margin-top:4px; color:#059669;">
          <span>Total Payments</span><span>-$${totalPayments.toFixed(2)}</span>
        </div>` : ''}
        
        <div style="font-size:18px; font-weight:bold; display:flex; justify-content:space-between; margin-top:12px; color:#000;">
          <span>BALANCE DUE</span><span>$${Number(bal).toFixed(2)}</span>
        </div>

        ${mode === 'INVOICE' ? `
        <div style="margin-top:50px; text-align:center;">
          <div style="border-top:1px solid #000; width:200px; margin:0 auto 8px auto;"></div>
          <p style="font-size:12px; margin:0; color:#000;">Guest Signature</p>
        </div>
        ` : ''}
        
        <div style="text-align:center; font-size:11px; margin-top:40px; color:#333; line-height:1.5;">
          <p style="color:#000; margin:0;"><strong>THANK YOU FOR CHOOSING KWALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
        </div>
        
        <div style="text-align:left; font-size:10px; margin-top:20px; color:#000; line-height:1.4; border-top:1px dashed #000; padding-top:10px;">
          <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
          Payment is due immediately upon receipt of this invoice unless otherwise agreed. All prices are subject to applicable charges. Any additional orders or services will be added to the final bill.
          <br/><br/>
          Thank you for choosing Kwalee Beach Resort.
        </div>
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
    const interval = setInterval(fetchBills, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectFolio = async (id: string, updateSelection = true) => {
    try {
      const res = await fetch(`/api/v1/folios/${id}/statement`);
      if (res.ok) {
        const json = await res.json();
        if (updateSelection) setSelectedBill({ ...json.data, type: "FOLIO" });
      }
    } catch (err) {
      console.error(err);
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
        setSelectedBill(null);
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
        setSelectedBill(null);
        fetchBills();
      } else {
        const error = await res.json();
        showToast(`Failed: ${error.message}`, "error");
      }
    } catch (err) { console.error(err); }
  };

  const handleDeletePOS = async () => {
    if (!selectedBill || selectedBill.type !== "POS_ORDER") return;
    if (!confirm("Are you sure you want to delete this POS order? This cannot be undone.")) return;
    // For safety, let's assume we can change its status to CANCELLED or call a delete endpoint.
    // If no delete endpoint exists, we can use the generic API or write a server action.
    try {
      // Trying the delete API if it exists, otherwise we'll have to add one.
      const res = await fetch(`/api/v1/pos/orders/${selectedBill.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("POS Order deleted.", "success");
        setSelectedBill(null);
        fetchBills();
      } else {
        // Fallback: Just update status to CANCELLED? The API might not allow it.
        showToast("Failed to delete. Please ensure backend delete endpoint exists.", "error");
      }
    } catch (err) {
       console.error(err);
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
            <p className="text-4xl font-extrabold text-white relative z-10 tracking-tight">${totalPendingRooms.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute -right-6 -top-6 text-cyan-500/10 group-hover:text-cyan-500/20 transition-all duration-500"><Receipt size={120} /></div>
            <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-2 relative z-10 uppercase">Pending F&B Billing</h3>
            <p className="text-4xl font-extrabold text-white relative z-10 tracking-tight">${totalPendingPOS.toFixed(2)}</p>
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
                  className={`bg-slate-900/60 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${selectedBill?.id === b.id ? 'border-cyan-500 bg-cyan-950/30 shadow-cyan-900/20' : 'border-slate-700/50 hover:border-slate-600'}`}
                  onClick={() => b.type === 'FOLIO' ? selectFolio(b.id) : setSelectedBill(b)}
                >
                  {b.type === 'FOLIO' ? (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-200 text-sm">Bill: {b.reservation?.guest?.lastName}</span>
                        <span className={`font-bold ${b.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${Number(b.balance).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-400">Room {b.reservation?.room?.number || 'N/A'}</div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-200 text-sm">POS: {b.table?.number ? `Table ${b.table.number}` : 'Walk-in'}</span>
                        <span className="font-bold text-rose-400">${Number(b.totalAmount).toFixed(2)}</span>
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
                  <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{selectedBill.reservation?.guest?.lastName} Folio</h2>
                  <div className="text-slate-400 font-medium">Room {selectedBill.reservation?.room?.number || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Balance Due</div>
                  <div className={`text-3xl font-bold ${selectedBill.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ${Number(selectedBill.balance).toFixed(2)}
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                      {selectedBill.status === 'OPEN' && Number(selectedBill.balance) === 0 && (
                          <button onClick={handleCloseFolio} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Close Bill</button>
                        )}
                        <button onClick={() => printViaIframe('INVOICE')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>
                        <button onClick={() => printViaIframe('RECEIPT')} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Receipt</button>
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
                        <th className="p-3 border-b border-slate-700 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {selectedBill.lineItems?.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">No transactions found.</td></tr>
                      ) : (
                        selectedBill.lineItems?.map((item: any) => (
                          <tr key={item.id} className="border-b border-slate-700/50 last:border-0">
                            <td className="p-3">{new Date(item.createdAt).toLocaleString()}</td>
                            <td className="p-3">{item.category.replace('_', ' ')}</td>
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-right text-rose-400 font-mono">{item.type === 'CHARGE' ? `$${Number(item.amount).toFixed(2)}` : ''}</td>
                            <td className="p-3 text-right text-emerald-400 font-mono">{item.type === 'PAYMENT' ? `$${Number(item.amount).toFixed(2)}` : ''}</td>
                          </tr>
                        ))
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
                      <option value="ROOM">Room Rate</option><option value="F_AND_B">Food & Beverage</option><option value="LAUNDRY">Laundry</option><option value="SPA">Spa</option><option value="TAX">GST / Tax</option><option value="OTHER">Other</option>
                    </select>
                    <input type="text" placeholder="Description" required value={chargeDesc} onChange={e => setChargeDesc(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                    <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                    <button type="submit" className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 p-2.5 rounded-lg font-bold transition-all">Add Charge</button>
                  </form>
                  { (isCashierOrManager || isFrontDesk) && (
                      <>
                    <form onSubmit={handlePostDiscount} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Discount</h4>
                      <input type="text" placeholder="Description (e.g. Service Apology)" value={discountDescription} onChange={e => setDiscountDescription(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-cyan-500" required />
                      <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-lg p-2.5 outline-none focus:border-cyan-500" required />
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
                      <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
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
                  <div className="text-4xl font-extrabold text-rose-400 tracking-tight">${Number(selectedBill.totalAmount).toFixed(2)}</div>
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
                          <td className="p-3 text-right font-mono">${Number(item.menuItem?.price).toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold">${(Number(item.menuItem?.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex gap-4 justify-end">
                {isAdmin && (
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
                      Checkout / Pay ${Number(selectedBill.totalAmount).toFixed(2)}
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
    </div>
  );
}
