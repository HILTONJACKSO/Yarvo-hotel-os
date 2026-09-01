'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PosReturnRequest = {
  id: string;
  orderItem: {
    quantity: number;
    menuItem: { name: string; price: string };
    order: {
      table: { number: string } | null;
    }
  };
  requestedBy: { firstName: string; lastName: string };
  confirmedBy?: { firstName: string; lastName: string } | null;
  approvedBy?: { firstName: string; lastName: string } | null;
  kitchenNote?: string;
  status: string;
  createdAt: string;
};

export default function ReturnsPage() {
  const { showToast } = useToast();
  const [returns, setReturns] = useState<PosReturnRequest[]>([]);

  const fetchReturns = () => {
    fetch(`${API_URL}/api/v1/pos/returns`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setReturns(data.data || data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchReturns();
    const interval = setInterval(fetchReturns, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (returnId: string, approved: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/pos/returns/${returnId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved })
      });
      if (!res.ok) throw new Error("Failed to process");
      showToast(`Return request ${approved ? 'approved' : 'rejected'}`, 'success', 'Success');
      fetchReturns();
    } catch (err) {
      showToast('Failed to process return request', 'error');
    }
  };

  return (
    <div className="returns-layout">
      <div className="header">
        <h2>Order Returns Management</h2>
        <p className="subtitle">Track and approve return requests from waitstaff and kitchen/bar.</p>
      </div>

      <div className="returns-grid">
        {returns.length === 0 && <p className="no-data">No return requests found.</p>}
        {returns.map(req => (
          <div key={req.id} className="return-card">
            <div className="r-header">
              <span className={`status-badge status-${req.status.toLowerCase()}`}>
                {req.status.replace('_', ' ')}
              </span>
              <span className="r-date">{new Date(req.createdAt).toLocaleString()}</span>
            </div>
            
            <div className="r-body">
              <h3>{req.orderItem.quantity}x {req.orderItem.menuItem.name}</h3>
              <p className="r-price">${Number(req.orderItem.menuItem.price).toFixed(2)}</p>
              <p><strong>Table:</strong> {req.orderItem.order.table?.number || 'Takeout'}</p>
              <p><strong>Requested By:</strong> {req.requestedBy.firstName} {req.requestedBy.lastName}</p>
              
              {req.kitchenNote && (
                <div className="r-note">
                  <strong>Kitchen/Bar Note:</strong> {req.kitchenNote}
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    - Confirmed by {req.confirmedBy?.firstName} {req.confirmedBy?.lastName}
                  </div>
                </div>
              )}

              {req.approvedBy && (
                <p><strong>Manager:</strong> {req.approvedBy.firstName} {req.approvedBy.lastName}</p>
              )}
            </div>

            {req.status === 'PENDING_APPROVAL' && (
              <div className="r-actions">
                <button className="btn-success" onClick={() => handleApprove(req.id, true)}>Approve Return</button>
                <button className="btn-danger" onClick={() => handleApprove(req.id, false)}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .returns-layout { padding: 24px; }
        .header h2 { margin: 0 0 8px 0; color: white; }
        .subtitle { color: hsl(215, 20%, 65%); margin-bottom: 24px; }
        
        .returns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        .return-card {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .r-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid hsl(217, 20%, 16%);
          padding-bottom: 12px;
        }
        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-pending_confirmation { background: hsl(43, 96%, 56%, 0.15); color: hsl(43, 96%, 60%); }
        .status-pending_approval { background: hsl(220, 90%, 56%, 0.15); color: hsl(220, 90%, 60%); }
        .status-approved { background: hsl(142, 76%, 45%, 0.15); color: hsl(142, 76%, 50%); }
        .status-rejected { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 60%); }
        
        .r-date { color: hsl(215, 20%, 65%); font-size: 0.85rem; }
        
        .r-body {
          color: hsl(215, 20%, 85%);
          font-size: 0.95rem;
        }
        .r-body h3 {
          margin: 0 0 4px 0;
          color: white;
          font-size: 1.2rem;
        }
        .r-price {
          color: hsl(142, 76%, 50%);
          font-weight: 600;
          margin-bottom: 12px;
        }
        .r-body p { margin: 4px 0; }
        
        .r-note {
          margin-top: 12px;
          background: hsl(43, 96%, 56%, 0.1);
          color: hsl(43, 96%, 60%);
          padding: 12px;
          border-radius: 6px;
        }

        .r-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
          border-top: 1px solid hsl(217, 20%, 16%);
          padding-top: 16px;
        }
        .btn-success {
          flex: 1;
          padding: 10px;
          background: hsl(142, 76%, 40%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-success:hover { background: hsl(142, 76%, 35%); }
        
        .btn-danger {
          flex: 1;
          padding: 10px;
          background: hsl(0, 84%, 40%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-danger:hover { background: hsl(0, 84%, 35%); }
        
        .no-data { color: hsl(215, 20%, 65%); }
      `}</style>
    </div>
  );
}
