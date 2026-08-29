'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PosOrderItem = {
  id: string;
  quantity: number;
  notes: string;
  status: string;
  createdAt: string;
  menuItem: { name: string; price: string };
  order: { 
    table: { number: string } | null;
    folio: { reservation: { room: { number: string } | null } } | null;
  };
};

export default function WaitstaffPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<PosOrderItem[]>([]);
  const [printItem, setPrintItem] = useState<PosOrderItem | null>(null);

  const fetchItems = () => {
    fetch(`${API_URL}/api/v1/pos/ready-items`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setItems(data.data || data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, []);

  const markServed = async (itemId: string) => {
    try {
      await fetch(`${API_URL}/api/v1/pos/order-items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'SERVED' })
      });
      showToast('Item served to customer', 'success', 'Success');
      fetchItems();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handlePrint = (item: PosOrderItem) => {
    setPrintItem(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="waitstaff-layout">
      <h2>Waitstaff Delivery Queue</h2>
      <p className="subtitle">Items ready to be delivered to tables.</p>
      
      <div className="orders-grid">
        {items.length === 0 && <div className="no-orders">No items waiting for delivery.</div>}
        {items.map(item => (
          <div key={item.id} className="order-card">
            <div className="order-header">
              <span className="table-badge">
                {item.order?.folio?.reservation?.room 
                  ? `Room ${item.order.folio.reservation.room.number}` 
                  : item.order?.table 
                    ? `Table ${item.order.table.number}` 
                    : 'Walk-in'
                }
              </span>
              <span className="time-badge">Ready</span>
            </div>
            <div className="order-body">
              <div className="item-row">
                <span className="qty">{item.quantity}x</span>
                <span className="name">{item.menuItem.name}</span>
              </div>
              {item.notes && <div className="notes">Note: {item.notes}</div>}
            </div>
            <div className="order-footer">
              <button className="btn-secondary" onClick={() => handlePrint(item)}>Print Receipt</button>
              <button className="btn-success" onClick={() => markServed(item.id)}>Deliver & Serve</button>
            </div>
          </div>
        ))}
      </div>

      {/* PRINT ONLY RECEIPT */}
      {printItem && (
        <div className="print-only-receipt">
          <div className="receipt-header">
            <h2>Yarvo Restaurant</h2>
            <p>
              {printItem.order?.folio?.reservation?.room 
                ? `Room ${printItem.order.folio.reservation.room.number}` 
                : printItem.order?.table 
                  ? `Table ${printItem.order.table.number}` 
                  : 'Walk-in'}
            </p>
            <h3>Customer Receipt</h3>
          </div>
          <div className="receipt-info">
            <p><strong>Date:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p><strong>Order ID:</strong> #{printItem.id.substring(0,8).toUpperCase()}</p>
          </div>
          <table className="receipt-table">
            <thead>
              <tr>
                <th>Qty</th>
                <th>Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{printItem.quantity}</td>
                <td>{printItem.menuItem.name}</td>
                <td>${(Number(printItem.menuItem.price) * printItem.quantity).toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                <td style={{ fontWeight: 'bold' }}>${(Number(printItem.menuItem.price) * printItem.quantity).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="receipt-footer">
            <p>Thank you for dining with us!</p>
          </div>
        </div>
      )}

      <style>{`
        .waitstaff-layout { padding: 20px; }
        .waitstaff-layout h2 { color: white; margin: 0 0 8px 0; font-size: 1.5rem; }
        .subtitle { color: hsl(215, 20%, 65%); margin-bottom: 24px; }
        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .order-card {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid hsl(217, 20%, 16%);
        }
        .table-badge {
          background: hsl(43,96%,56%, 0.15);
          color: hsl(43,96%,60%);
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .time-badge {
          color: hsl(215, 20%, 65%);
          font-size: 0.875rem;
        }
        .order-body { flex: 1; }
        .item-row {
          display: flex;
          gap: 12px;
          font-size: 1.1rem;
          color: white;
          font-weight: 500;
        }
        .qty { color: hsl(215, 20%, 50%); }
        .notes {
          margin-top: 8px;
          font-size: 0.9rem;
          color: hsl(43,96%,60%);
          background: hsl(43,96%,56%, 0.1);
          padding: 8px;
          border-radius: 6px;
        }
        .order-footer { 
          margin-top: auto; 
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 8px;
        }
        .btn-success {
          padding: 12px;
          background: hsl(142, 76%, 45%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-success:hover { background: hsl(142, 76%, 40%); }
        .btn-secondary {
          padding: 12px;
          background: transparent;
          color: white;
          border: 1px solid hsl(217, 20%, 30%);
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-secondary:hover { background: hsl(217, 20%, 20%); }
        .no-orders { color: hsl(215, 20%, 50%); font-size: 1.1rem; }
        .print-only-receipt { display: none; }
      `}</style>
    </div>
  );
}

