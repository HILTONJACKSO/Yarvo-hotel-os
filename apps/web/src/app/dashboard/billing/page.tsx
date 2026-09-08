"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/lib/auth-provider";
import { ShoppingCart, Edit, Trash2, Receipt } from "lucide-react";

export default function BillingPage() {
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

  const fetchBills = async () => {
    setLoading(true);
    try {
      // Fetch open folios
      const resFolios = await fetch("/api/v1/folios?status=OPEN");
      const jsonFolios = resFolios.ok ? await resFolios.json() : { data: [] };
      const folios = (jsonFolios.data || []).map((f: any) => ({ ...f, type: "FOLIO" }));

      // Fetch POS served orders
      const resPos = await fetch("/api/v1/pos/served-orders");
      const jsonPos = resPos.ok ? await resPos.json() : { data: [] };
      const allPos = jsonPos.data || [];
      
      // Filter POS: only those invoiced (printed > 0)
      const invoicedPos = allPos.filter((o: any) => o.invoicePrintCount > 0 && o.status === "SERVED");
      const posOrders = invoicedPos.map((o: any) => ({ ...o, type: "POS_ORDER" }));

      // Calculate total pending POS
      const totalPosAmount = posOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      setTotalPendingPOS(totalPosAmount);

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

  if (loading && bills.length === 0) return <div className="flex items-center justify-center h-full text-slate-400">Loading Billing...</div>;

  return (
    <div className="flex flex-col h-full gap-6 pb-10">
      {/* Top Bar Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-slate-700/30"><Receipt size={100} /></div>
          <h3 className="text-sm font-medium text-slate-400 mb-2 relative z-10">Pending F&B Billing</h3>
          <p className="text-3xl font-bold text-cyan-400 relative z-10">${totalPendingPOS.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 items-start">
        {/* Sidebar: List of Bills */}
        <div className="w-[320px] bg-slate-800 border border-slate-700 rounded-xl flex flex-col shrink-0 sticky top-[80px] max-h-[calc(100vh-100px)] overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/80">
            <h3 className="text-lg font-bold text-slate-100">Active Bills</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {bills.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No active bills found.</p>
            ) : (
              bills.map(b => (
                <div 
                  key={b.id} 
                  className={`bg-slate-900/50 border rounded-lg p-3 cursor-pointer transition-all hover:bg-slate-700 ${selectedBill?.id === b.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700/50'}`}
                  onClick={() => b.type === 'FOLIO' ? selectFolio(b.id) : setSelectedBill(b)}
                >
                  {b.type === 'FOLIO' ? (
                    <>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-200 text-sm">Folio: {b.reservation?.guest?.lastName}</span>
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
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          {!selectedBill ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20">
              <Receipt size={64} className="mb-4 opacity-20" />
              <p>Select a bill from the left to view details.</p>
            </div>
          ) : selectedBill.type === 'FOLIO' ? (
            // FOLIO RENDER
            <>
              <div className="p-6 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">{selectedBill.reservation?.guest?.lastName} Folio</h2>
                  <div className="text-slate-400 text-sm">Status: {selectedBill.status} | Room: {selectedBill.reservation?.room?.number}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Balance Due</div>
                  <div className={`text-3xl font-bold ${selectedBill.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ${Number(selectedBill.balance).toFixed(2)}
                  </div>
                  <button onClick={() => window.open(`/invoice/${selectedBill.id}`, '_blank')} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors">Print Invoice</button>
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
                <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex gap-6">
                  <form onSubmit={handlePostCharge} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                    <h4 className="font-bold text-slate-200">Post Charge</h4>
                    <select value={chargeCategory} onChange={(e) => setChargeCategory(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none">
                      <option value="ROOM">Room Rate</option><option value="F_AND_B">Food & Beverage</option><option value="LAUNDRY">Laundry</option><option value="SPA">Spa</option>
                    </select>
                    <input type="text" placeholder="Description" required value={chargeDesc} onChange={e => setChargeDesc(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                    <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                    <button type="submit" className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 p-2.5 rounded-lg font-bold transition-all">Add Charge</button>
                  </form>
                  {isCashierOrManager && (
                    <form onSubmit={handlePostPayment} className="flex-1 bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col gap-3">
                      <h4 className="font-bold text-slate-200">Post Payment</h4>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none">
                        <option value="PAYMENT_CARD">Credit Card</option><option value="PAYMENT_CASH">Cash</option>
                      </select>
                      <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg outline-none" />
                      <button type="submit" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 p-2.5 rounded-lg font-bold transition-all">Add Payment</button>
                    </form>
                  )}
                </div>
              )}
            </>
          ) : (
            // POS ORDER RENDER
            <>
              <div className="p-6 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">POS Order #{selectedBill.id.substring(0,8).toUpperCase()}</h2>
                  <div className="text-slate-400 text-sm">Location: {selectedBill.table?.number ? `Table ${selectedBill.table.number}` : 'Walk-in'} | Printed: {selectedBill.invoicePrintCount} times</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Balance Due</div>
                  <div className="text-3xl font-bold text-rose-400">${Number(selectedBill.totalAmount).toFixed(2)}</div>
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
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded-xl outline-none">
                      <option value="PAYMENT_CASH">Cash</option>
                      <option value="PAYMENT_CARD">Credit Card</option>
                      <option value="PAYMENT_MOBILE">Mobile Money</option>
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
    </div>
  );
}
