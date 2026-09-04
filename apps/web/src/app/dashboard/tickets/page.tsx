'use client';

import { useState, useEffect } from 'react';
import { Ticket, Waves, Umbrella, Search, CheckCircle, Plus, Settings, Trash2, Minus, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs: ISSUE (cart), TICKETS (history), SETTINGS
  const [activeTab, setActiveTab] = useState<'ISSUE' | 'TICKETS' | 'SETTINGS'>('ISSUE');
  
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  
  // Cart for issuing multiple tickets
  const [cart, setCart] = useState<{ tier: any; quantity: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTicketsAndTiers = async () => {
    setIsLoading(true);
    try {
      const [ticketsRes, tiersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets`, { credentials: 'include' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/tiers`, { credentials: 'include' })
      ]);
      
      if (ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setTickets(tData.data);
      }
      
      if (tiersRes.ok) {
        const tierData = await tiersRes.json();
        setTiers(tierData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndTiers();
  }, []);

  const handleMarkUsed = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/${id}/use`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        fetchTicketsAndTiers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTierName, price: parseFloat(newTierPrice) }),
        credentials: 'include'
      });
      if (res.ok) {
        setNewTierName('');
        setNewTierPrice('');
        fetchTicketsAndTiers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTier = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets/tiers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchTicketsAndTiers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CART LOGIC
  const addToCart = (tier: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.tier.id === tier.id);
      if (existing) {
        return prev.map(item => item.tier.id === tier.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { tier, quantity: 1 }];
    });
  };

  const removeFromCart = (tierId: string) => {
    setCart(prev => prev.filter(item => item.tier.id !== tierId));
  };

  const updateQuantity = (tierId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.tier.id === tierId) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: Math.max(0, newQ) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.tier.price) * item.quantity), 0);
  const gstRate = 0.10;
  const subtotal = cartTotal / (1 + gstRate);
  const gst = cartTotal - subtotal;

  const printReceipt = () => {
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
    cart.forEach(item => {
      itemsHtml += `
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
          <div><span style="margin-right: 8px;">${item.quantity}x</span><span>${item.tier.name}</span></div>
          <span>$${(Number(item.tier.price) * item.quantity).toFixed(2)}</span>
        </div>
      `;
    });

    doc.write(`
      <html>
        <head>
          <title>Print Ticket Receipt</title>
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
          <p class="sub">TICKET RECEIPT</p>
          
          <div class="meta"><span>DATE</span> <span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
          <div class="meta"><span>STAFF</span> <span>${user?.firstName || ''} ${user?.lastName || ''}</span></div>
          
          <div class="divider"></div>
          
          ${itemsHtml}
          
          <div class="divider"></div>
          
          <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="summary-row"><span>GST (10%)</span><span>$${gst.toFixed(2)}</span></div>
          <div class="totals"><span>TOTAL</span><span>$${cartTotal.toFixed(2)}</span></div>
          
          <div class="footer">
            <p><strong>THANK YOU FOR CHOOSING KWAALEE BEACH RESORT!</strong><br/>PLEASE COME AGAIN!</p>
          </div>
          
          <div class="footer-terms">
            <strong>PAYMENT TERMS & CONDITIONS:</strong><br/>
            All sales are final. Tickets must be presented upon entry.
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      const promises = [];
      const validDateStr = new Date().toISOString().split('T')[0];

      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          promises.push(
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: item.tier.name,
                price: Number(item.tier.price),
                guestName: '',
                guestPhone: '',
                paymentMethod: 'CASH',
                validDate: validDateStr,
              }),
              credentials: 'include'
            })
          );
        }
      }
      
      await Promise.all(promises);
      printReceipt();
      setCart([]);
      fetchTicketsAndTiers();
    } catch (error) {
      console.error(error);
      alert('Failed to issue tickets');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="text-cyan-400" />
            Tickets Point of Sale
          </h1>
          <p className="text-slate-400">Issue and manage facility day passes</p>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('ISSUE')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'ISSUE' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Issue Tickets
          </button>
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'TICKETS' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            History
          </button>
          {user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role?.toUpperCase?.() || (role as any)?.name?.toUpperCase?.())) && (
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'SETTINGS' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Settings size={16} />
              Settings
            </button>
          )}
        </div>
      </div>

      {activeTab === 'ISSUE' && (
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Menu Items (Left) */}
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 sticky top-0">
              <h2 className="text-lg font-bold text-slate-100">Select Ticket Types</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {tiers.map(tier => (
                  <button
                    key={tier.id}
                    onClick={() => addToCart(tier)}
                    className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-h-[120px]"
                  >
                    <div>
                      <h3 className="font-bold text-slate-200 line-clamp-2">{tier.name}</h3>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <span className="text-emerald-400 font-bold">${Number(tier.price).toFixed(2)}</span>
                      <div className="bg-cyan-500/20 text-cyan-400 p-1.5 rounded-lg">
                        <Plus size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart (Right) */}
          <div className="w-[380px] bg-slate-800 border border-slate-700 rounded-xl flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 sticky top-0 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShoppingCart size={20} className="text-cyan-400" />
                Current Order
              </h2>
              <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>Add tickets to start issuing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.tier.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className="text-slate-200 font-medium">{item.tier.name}</span>
                        <span className="text-emerald-400 font-bold">${(Number(item.tier.price) * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">${Number(item.tier.price).toFixed(2)} each</span>
                        <div className="flex items-center gap-3 bg-slate-800 rounded-lg border border-slate-600 p-1">
                          <button 
                            onClick={() => updateQuantity(item.tier.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-4 text-center font-bold text-slate-200">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.tier.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-700 bg-slate-900/80">
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST (10%)</span>
                    <span>${gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-lg pt-2 border-t border-slate-700">
                    <span>Total</span>
                    <span className="text-emerald-400">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleCheckout}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20"
                >
                  {isProcessing ? 'Issuing...' : 'Checkout & Print Receipt'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/20 p-6 rounded-xl flex items-center gap-4">
              <div className="p-4 bg-cyan-500/20 rounded-lg text-cyan-400">
                <Ticket size={32} />
              </div>
              <div>
                <h3 className="text-slate-300 font-medium">Valid Passes</h3>
                <p className="text-2xl font-bold text-slate-100">
                  {tickets.filter(t => t.status === 'VALID').length}
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl flex items-center gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg text-slate-400">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-slate-300 font-medium">Used Passes</h3>
                <p className="text-2xl font-bold text-slate-100">
                  {tickets.filter(t => t.status === 'USED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-700 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by ticket ID..." 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-400 text-sm">
                    <th className="p-4 font-medium">Ticket ID</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Guest Name</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Loading tickets...</td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No tickets issued yet.</td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-300 font-mono text-sm">
                          {ticket.id.split('-')[0].toUpperCase()}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-700 rounded text-xs font-medium text-slate-300">
                            {ticket.type}
                          </span>
                        </td>
                        <td className="p-4 text-slate-200">{ticket.guestName || 'Walk-in Guest'}</td>
                        <td className="p-4 text-emerald-400 font-medium">
                          ${Number(ticket.price).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ticket.status === 'VALID' ? 'bg-cyan-500/20 text-cyan-400' : 
                            ticket.status === 'USED' ? 'bg-slate-600 text-slate-400' : 
                            'bg-rose-500/20 text-rose-400'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {ticket.status === 'VALID' && (
                            <button 
                              onClick={() => handleMarkUsed(ticket.id)}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition-colors"
                            >
                              Mark Used
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-6">
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Add Ticket Type</h2>
            <form onSubmit={handleCreateTier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Ticket Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. VIP Cabana"
                  value={newTierName}
                  onChange={(e) => setNewTierName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Default Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  value={newTierPrice}
                  onChange={(e) => setNewTierPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Ticket Type
              </button>
            </form>
          </div>
          
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-slate-100">Custom Ticket Types</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Default Price</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {tiers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">No ticket types found. Add one on the left.</td>
                  </tr>
                ) : (
                  tiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-slate-800/30">
                      <td className="p-4 text-slate-200 font-medium">{tier.name}</td>
                      <td className="p-4 text-emerald-400">${Number(tier.price).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDeleteTier(tier.id)}
                          className="text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
