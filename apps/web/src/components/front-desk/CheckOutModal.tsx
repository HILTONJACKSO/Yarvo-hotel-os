'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/toast-provider';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reservation: any;
}

export function CheckOutModal({ isOpen, onClose, onSuccess, reservation }: Props) {
  const { showToast } = useToast();
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentCategory, setPaymentCategory] = useState<string>('PAYMENT_CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchStatement = async () => {
    if (!reservation?.folio?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/folios/${reservation.folio.id}/statement`);
      if (res.ok) {
        const json = await res.json();
        const folioData = json.data || json;
        setStatement(folioData);
        setPaymentAmount(folioData.balance); // Pre-fill with remaining balance
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && reservation) {
      fetchStatement();
    }
  }, [isOpen, reservation]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/v1/folios/${statement.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          category: paymentCategory,
          description: 'Payment collected at Check-Out'
        })
      });
      if (res.ok) {
        showToast('Payment applied successfully', 'success', 'Success');
        fetchStatement(); // refresh balance
      } else {
        const error = await res.json();
        showToast(`Payment failed: ${error.message}`, 'error', 'Error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteCheckOut = async () => {
    if (!reservation) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch(`/api/v1/reservations/${reservation.id}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billToCompany })
      });
      if (res.ok) {
        showToast('Check-out successful! Folio closed.', 'success', 'Checked Out');
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        showToast(`Check-out failed: ${error.message}`, 'error', 'Error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePrint = () => {
    // We will trigger a print. CSS will handle showing ONLY the print area.
    window.print();
  };

  const [billToCompany, setBillToCompany] = useState(false);

  if (!reservation) return null;

  const balance = Number(statement?.balance || 0);
  const isPaid = balance <= 0 || billToCompany;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guest Check-Out & Folio" size="lg">
      {loading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
      ) : (
        <div className="checkout-modal-content">
          <div className="folio-summary">
            <div className="fs-row">
              <span className="fs-label">Guest:</span>
              <span className="fs-value">{reservation.guest.lastName}, {reservation.guest.firstName}</span>
            </div>
            <div className="fs-row">
              <span className="fs-label">Room:</span>
              <span className="fs-value">{reservation.room?.number || 'N/A'}</span>
            </div>
            <div className="fs-row fs-total">
              <span className="fs-label">Outstanding Balance:</span>
              <span className="fs-value ${balance > 0 ? 'text-danger' : 'text-success'}">
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="folio-items">
            <h4>Folio Statement</h4>
            {statement?.lineItems?.length === 0 && <p className="text-muted">No charges on folio.</p>}
            <div className="items-list">
              {statement?.lineItems?.map((item: any) => (
                <div key={item.id} className="f-item">
                  <div className="f-item-left">
                    <span className="f-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="f-desc">{item.description}</span>
                  </div>
                  <div className={`f-amount ${item.type === 'PAYMENT' ? 'text-success' : ''}`}>
                    {item.type === 'PAYMENT' ? '-' : ''}${Number(item.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isPaid && (
            <div className="payment-section">
              <h4>Process Payment</h4>
              <form onSubmit={handlePayment} className="payment-form">
                <div className="form-group">
                  <label>Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)} 
                    max={balance}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select required value={paymentCategory} onChange={e => setPaymentCategory(e.target.value)}>
                    <option value="PAYMENT_CASH">Cash</option>
                    <option value="PAYMENT_CARD">Credit Card</option>
                    <option value="PAYMENT_MOBILE">Mobile Money</option>
                    <option value="PAYMENT_BANK">Bank Transfer</option>
                  </select>
                </div>
                <button type="submit" className="btn-success" disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Add Payment'}
                </button>
              </form>
            </div>
          )}
          
          {reservation.companyId && balance > 0 && (
            <div className="corporate-billing-section">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={billToCompany} 
                  onChange={(e) => setBillToCompany(e.target.checked)} 
                />
                Bill Remaining Balance (${balance.toFixed(2)}) to Corporate Account
              </label>
            </div>
          )}

          <div className="modal-actions-footer">
            <button type="button" className="btn-secondary" onClick={handlePrint}>
              Print Receipt
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              disabled={!isPaid || isCheckingOut}
              onClick={handleCompleteCheckOut}
            >
              {isCheckingOut ? 'Processing...' : 'Complete Check-Out'}
            </button>
          </div>

          {/* PRINT ONLY SECTION */}
          <div className="print-only-receipt">
            <div className="receipt-header">
              <h2>Yarvo Hotel</h2>
              <p>Monrovia, Liberia</p>
              <h3>Guest Folio</h3>
            </div>
            <div className="receipt-info">
              <p><strong>Guest:</strong> {reservation.guest.lastName}, {reservation.guest.firstName}</p>
              <p><strong>Room:</strong> {reservation.room?.number}</p>
              <p><strong>Check-In:</strong> {new Date(reservation.checkInDate).toLocaleDateString()}</p>
              <p><strong>Check-Out:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {statement?.lineItems?.map((item: any) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td>{item.description}</td>
                    <td>{item.type === 'PAYMENT' ? '-' : ''}${Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Balance Due:</td>
                  <td style={{ fontWeight: 'bold' }}>${balance.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div className="receipt-footer">
              <p>Thank you for choosing Yarvo Hotel!</p>
            </div>
          </div>

        </div>
      )}

      <style>{`
        .checkout-modal-content { display: flex; flex-direction: column; gap: 24px; }
        .folio-summary { background: hsl(222, 35%, 15%); padding: 16px; border-radius: 8px; border: 1px solid hsl(217, 20%, 25%); }
        .fs-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .fs-row:last-child { margin-bottom: 0; }
        .fs-label { color: hsl(215, 20%, 65%); }
        .fs-value { color: white; font-weight: 500; }
        .fs-total { margin-top: 12px; padding-top: 12px; border-top: 1px solid hsl(217, 20%, 25%); font-size: 1.125rem; font-weight: 700; }
        
        .text-danger { color: hsl(0, 84%, 60%) !important; }
        .text-success { color: hsl(142, 76%, 45%) !important; }
        .text-muted { color: hsl(215, 20%, 50%); }

        .folio-items h4, .payment-section h4 { margin: 0 0 12px 0; color: hsl(210, 40%, 96%); border-bottom: 1px solid hsl(217, 20%, 16%); padding-bottom: 8px; }
        .items-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .f-item { display: flex; justify-content: space-between; padding: 8px; background: hsl(222, 35%, 10%); border-radius: 6px; }
        .f-item-left { display: flex; flex-direction: column; gap: 4px; }
        .f-date { font-size: 0.75rem; color: hsl(215, 20%, 50%); }
        .f-desc { font-size: 0.875rem; color: white; }
        .f-amount { font-weight: 600; color: white; }

        .payment-form { display: flex; gap: 12px; align-items: flex-end; }
        .payment-form .form-group { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .payment-form label { font-size: 0.75rem; color: hsl(215, 20%, 65%); }
        .payment-form input, .payment-form select { background: hsl(220, 30%, 8%); border: 1px solid hsl(217, 20%, 20%); color: white; padding: 8px 12px; border-radius: 6px; }
        
        .btn-success { background: hsl(142, 76%, 36%); color: white; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-success:disabled { opacity: 0.5; }
        
        .modal-actions-footer { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid hsl(217, 20%, 16%); }
        .btn-secondary { background: transparent; border: 1px solid hsl(217, 20%, 30%); color: white; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: hsl(43,96%,56%); color: hsl(224, 39%, 6%); border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .corporate-billing-section { padding: 12px; background: hsl(43,96%,56%, 0.1); border: 1px solid hsl(43,96%,56%, 0.3); border-radius: 6px; margin-top: 12px; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; color: hsl(210, 40%, 96%); font-weight: 500; cursor: pointer; }

        .print-only-receipt { display: none; }
      `}</style>
    </Modal>
  );
}

