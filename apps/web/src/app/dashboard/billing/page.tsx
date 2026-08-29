'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';

type FolioLineItem = {
  id: string;
  type: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT';
  category: string;
  amount: number;
  description: string;
  referenceCode?: string;
  createdAt: string;
};

type Folio = {
  id: string;
  balance: number;
  status: 'OPEN' | 'CLOSED';
  reservation: {
    guest: { firstName: string; lastName: string };
    room: { number: string } | null;
  };
  lineItems: FolioLineItem[];
};

export default function BillingPage() {
  const { showToast } = useToast();
  const [folios, setFolios] = useState<Folio[]>([]);
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeCategory, setChargeCategory] = useState('ROOM');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAYMENT_CARD');

  const fetchFolios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/folios?status=OPEN');
      if (res.ok) {
        const json = await res.json();
        setFolios(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolios();
  }, []);

  const selectFolio = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/folios/${id}/statement`);
      if (res.ok) {
        const json = await res.json();
        setSelectedFolio(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio) return;
    
    try {
      const res = await fetch(`/api/v1/folios/${selectedFolio.id}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(chargeAmount),
          description: chargeDesc,
          category: chargeCategory,
        }),
      });

      if (res.ok) {
        showToast('Charge posted successfully!', 'success', 'Success');
        setChargeAmount('');
        setChargeDesc('');
        selectFolio(selectedFolio.id);
        fetchFolios();
      } else {
        const error = await res.json();
        showToast(`Failed: ${error.message}`, 'error', 'Error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolio) return;

    try {
      const res = await fetch(`/api/v1/folios/${selectedFolio.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          description: `Payment - ${paymentMethod.replace('PAYMENT_', '')}`,
          category: paymentMethod,
        }),
      });

      if (res.ok) {
        showToast('Payment posted successfully!', 'success', 'Success');
        setPaymentAmount('');
        selectFolio(selectedFolio.id);
        fetchFolios();
      } else {
        const error = await res.json();
        showToast(`Failed: ${error.message}`, 'error', 'Error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-state">Loading Folios...</div>;

  return (
    <div className="billing-layout">
      {/* Sidebar: List of Folios */}
      <div className="folios-list">
        <h3>Active Folios</h3>
        {folios.length === 0 ? (
          <p className="empty-text">No active folios found.</p>
        ) : (
          folios.map(f => (
            <div 
              key={f.id} 
              className={`folio-card ${selectedFolio?.id === f.id ? 'active' : ''}`}
              onClick={() => selectFolio(f.id)}
            >
              <div className="folio-guest">{f.reservation.guest.lastName}, {f.reservation.guest.firstName}</div>
              <div className="folio-room">Room: {f.reservation.room?.number || 'N/A'}</div>
              <div className={`folio-balance ${f.balance > 0 ? 'balance-owed' : 'balance-zero'}`}>
                ${Number(f.balance).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Area: Folio Statement & Actions */}
      <div className="folio-details">
        {!selectedFolio ? (
          <div className="empty-state">Select a folio from the left to view statement and post transactions.</div>
        ) : (
          <>
            <div className="details-header">
              <div>
                <h2>{selectedFolio.reservation.guest.lastName} Folio</h2>
                <div className="text-muted">Status: {selectedFolio.status} | Room: {selectedFolio.reservation.room?.number}</div>
              </div>
              <div className="balance-box">
                <span className="balance-label">Total Balance Due</span>
                <span className={`balance-amount ${selectedFolio.balance > 0 ? 'balance-owed' : 'balance-zero'}`}>
                  ${Number(selectedFolio.balance).toFixed(2)}
                </span>
                <button 
                  className="btn-print-invoice"
                  onClick={() => window.open(`/invoice/${selectedFolio.id}`, '_blank')}
                >
                  Print Invoice
                </button>
              </div>
            </div>

            <div className="ledger-container">
              <h3>Ledger Entries</h3>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="amount-col">Charge</th>
                    <th className="amount-col">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFolio.lineItems?.length === 0 ? (
                    <tr><td colSpan={5} className="empty-text">No transactions found.</td></tr>
                  ) : (
                    selectedFolio.lineItems?.map(item => (
                      <tr key={item.id}>
                        <td>{new Date(item.createdAt).toLocaleString()}</td>
                        <td>{item.category.replace('_', ' ')}</td>
                        <td>{item.description}</td>
                        <td className="amount-col charge-text">
                          {item.type === 'CHARGE' ? `$${Number(item.amount).toFixed(2)}` : ''}
                        </td>
                        <td className="amount-col credit-text">
                          {item.type === 'PAYMENT' ? `$${Number(item.amount).toFixed(2)}` : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Transaction Actions */}
            {selectedFolio.status === 'OPEN' && (
              <div className="actions-panel">
                <form className="action-form" onSubmit={handlePostCharge}>
                  <h4>Post Charge</h4>
                  <select value={chargeCategory} onChange={(e) => setChargeCategory(e.target.value)}>
                    <option value="ROOM">Room Rate</option>
                    <option value="F_AND_B">Food & Beverage</option>
                    <option value="LAUNDRY">Laundry</option>
                    <option value="SPA">Spa</option>
                  </select>
                  <input type="text" placeholder="Description" required value={chargeDesc} onChange={e => setChargeDesc(e.target.value)} />
                  <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={chargeAmount} onChange={e => setChargeAmount(e.target.value)} />
                  <button type="submit" className="btn-charge">Add Charge</button>
                </form>

                <form className="action-form" onSubmit={handlePostPayment}>
                  <h4>Post Payment</h4>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="PAYMENT_CARD">Credit Card</option>
                    <option value="PAYMENT_CASH">Cash</option>
                  </select>
                  <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                  <button type="submit" className="btn-payment">Add Payment</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .billing-layout { display: flex; height: calc(100vh - 120px); gap: 24px; }
        
        /* Folio List Sidebar */
        .folios-list { width: 300px; background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .folios-list h3 { margin: 0; color: hsl(210, 40%, 96%); font-size: 1rem; border-bottom: 1px solid hsl(217, 20%, 14%); padding-bottom: 12px; }
        .folio-card { background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 18%); padding: 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .folio-card:hover { border-color: hsl(217, 20%, 25%); background: hsl(220, 30%, 8%); }
        .folio-card.active { border-color: hsl(43, 96%, 56%); background: hsl(43, 96%, 56%, 0.1); }
        .folio-guest { font-weight: 600; color: hsl(210, 40%, 92%); font-size: 0.875rem; }
        .folio-room { color: hsl(215, 20%, 60%); font-size: 0.75rem; margin-top: 4px; }
        .folio-balance { margin-top: 8px; font-weight: 700; font-size: 1rem; }
        
        /* Main Details Area */
        .folio-details { flex: 1; background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
        .details-header { padding: 24px; border-bottom: 1px solid hsl(217, 20%, 14%); display: flex; justify-content: space-between; align-items: center; background: hsl(220, 30%, 5%); }
        .details-header h2 { margin: 0 0 8px 0; color: hsl(210, 40%, 96%); }
        .text-muted { color: hsl(215, 20%, 55%); font-size: 0.875rem; }
        .balance-box { text-align: right; }
        .balance-label { display: block; color: hsl(215, 20%, 60%); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .balance-amount { display: block; font-size: 2rem; font-weight: 700; }
        .btn-print-invoice { margin-top: 12px; background: hsl(210, 100%, 50%); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: background 0.2s; }
        .btn-print-invoice:hover { background: hsl(210, 100%, 45%); }
        
        .balance-owed { color: hsl(0, 84%, 65%); } /* Red */
        .balance-zero { color: hsl(142, 76%, 55%); } /* Green */

        .ledger-container { flex: 1; padding: 24px; overflow-y: auto; }
        .ledger-container h3 { margin: 0 0 16px 0; color: hsl(210, 40%, 96%); }
        .ledger-table { width: 100%; border-collapse: collapse; text-align: left; }
        .ledger-table th { background: hsl(220, 30%, 5%); padding: 10px 12px; font-size: 0.75rem; text-transform: uppercase; color: hsl(215, 20%, 50%); border-bottom: 1px solid hsl(217, 20%, 14%); }
        .ledger-table td { padding: 12px; border-bottom: 1px solid hsl(217, 20%, 12%); color: hsl(210, 40%, 92%); font-size: 0.875rem; }
        .amount-col { text-align: right; font-family: monospace; }
        .charge-text { color: hsl(0, 84%, 65%); }
        .credit-text { color: hsl(142, 76%, 55%); }

        /* Actions */
        .actions-panel { padding: 24px; border-top: 1px solid hsl(217, 20%, 14%); background: hsl(220, 30%, 5%); display: flex; gap: 24px; }
        .action-form { flex: 1; background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 16%); padding: 16px; border-radius: 8px; display: flex; flex-direction: column; gap: 12px; }
        .action-form h4 { margin: 0; color: hsl(210, 40%, 96%); }
        .action-form select, .action-form input { background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 20%); color: hsl(210, 40%, 92%); padding: 10px; border-radius: 6px; outline: none; }
        .btn-charge { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.3); padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-charge:hover { background: hsl(0, 84%, 60%, 0.25); }
        .btn-payment { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); border: 1px solid hsl(142, 76%, 36%, 0.3); padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-payment:hover { background: hsl(142, 76%, 36%, 0.25); }
        
        .empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: hsl(215, 20%, 50%); }
        .empty-text { color: hsl(215, 20%, 50%); font-size: 0.875rem; text-align: center; margin-top: 20px; }
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }
      `}</style>
    </div>
  );
}

