'use client';

import { useState, useEffect } from 'react';
import { Ticket, Waves, Umbrella, Search, CheckCircle, Plus, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'SETTINGS'>('TICKETS');
  
  const [formData, setFormData] = useState({
    type: '',
    price: '',
    guestName: '',
    guestPhone: '',
    paymentMethod: 'CASH',
    validDate: new Date().toISOString().split('T')[0],
  });

  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');

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
        if (tierData.data.length > 0 && !formData.type) {
          setFormData(prev => ({
            ...prev,
            type: tierData.data[0].name,
            price: tierData.data[0].price.toString(),
          }));
        }
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

  const handleTierSelection = (tierName: string) => {
    const selectedTier = tiers.find(t => t.name === tierName);
    if (selectedTier) {
      setFormData(prev => ({
        ...prev,
        type: tierName,
        price: selectedTier.price.toString()
      }));
    }
  };

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          type: tiers.length > 0 ? tiers[0].name : '',
          price: tiers.length > 0 ? tiers[0].price.toString() : '',
          guestName: '',
          guestPhone: '',
          paymentMethod: 'CASH',
          validDate: new Date().toISOString().split('T')[0],
        });
        fetchTicketsAndTiers();
      } else {
        alert('Failed to issue ticket');
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="text-cyan-400" />
            Day Pass Tickets
          </h1>
          <p className="text-slate-400">Manage and issue facility day passes</p>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'TICKETS' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Manage Tickets
          </button>
          {user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase())) && (
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'SETTINGS' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Settings size={16} />
              Ticket Types
            </button>
          )}
        </div>
      </div>

      {activeTab === 'TICKETS' && (
        <>
          <div className="flex justify-end mb-6">
            {user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase())) && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Issue Ticket
              </button>
            )}
          </div>

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

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by guest name or ticket ID..." 
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
        </>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-slate-100">Issue New Ticket</h2>
            </div>
            <form onSubmit={handleIssueTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Ticket Type</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => handleTierSelection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {tiers.map(tier => (
                    <option key={tier.id} value={tier.name}>{tier.name} (${Number(tier.price).toFixed(2)})</option>
                  ))}
                  {tiers.length === 0 && <option value="" disabled>No Ticket Types found. Please add in Settings.</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Price ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Guest Name (Optional)</label>
                  <input 
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Guest Phone (Optional)</label>
                  <input 
                    type="text"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({...formData, guestPhone: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Payment Method</label>
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="MOBILE">Mobile Pay (Apple/Google)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={tiers.length === 0}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Issue Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

