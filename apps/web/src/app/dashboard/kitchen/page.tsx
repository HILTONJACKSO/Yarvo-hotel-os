'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type OrderItem = {
  id: string;
  quantity: number;
  notes: string | null;
  status: string;
  menuItem: { name: string; type: string };
};

type Order = {
  id: string;
  table: { number: string } | null;
  items: OrderItem[];
};

export default function KitchenPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = () => {
    fetch(`${API_URL}/api/v1/pos/orders`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setOrders(data.data || data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/v1/pos/order-items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
      showToast('Status updated', 'success', 'Success');
    } catch (err) {
      showToast('Failed to update status', 'error', 'Error');
    }
  };

  // Filter out orders that don't have FOOD items
  const kitchenOrders = orders
    .map(o => ({
      ...o,
      items: o.items.filter(i => i.menuItem.type === 'FOOD' && i.status !== 'SERVED')
    }))
    .filter(o => o.items.length > 0);

  return (
    <div className="kitchen-layout">
      <h2>Kitchen Display System (KDS)</h2>
      
      <div className="ticket-grid">
        {kitchenOrders.length === 0 && <p className="no-tickets">No active food orders.</p>}
        
        {kitchenOrders.map(order => (
          <div key={order.id} className="ticket">
            <div className="ticket-header">
              <span className="ticket-table">Table {order.table?.number || 'Takeout'}</span>
              <span className="ticket-id">#{order.id.split('-')[0]}</span>
            </div>
            
            <div className="ticket-items">
              {order.items.map(item => (
                <div key={item.id} className={`t-item status-${item.status.toLowerCase()}`}>
                  <div className="t-item-main">
                    <span className="qty">{item.quantity}x</span>
                    <span className="name">{item.menuItem.name}</span>
                  </div>
                  {item.notes && <div className="t-notes">Note: {item.notes}</div>}
                  
                  <div className="t-actions">
                    {item.status === 'PENDING' && (
                      <button onClick={() => updateStatus(item.id, 'COOKING')}>Start Cooking</button>
                    )}
                    {item.status === 'COOKING' && (
                      <button onClick={() => updateStatus(item.id, 'READY')} className="ready-btn">Mark Ready</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .kitchen-layout {
          height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }
        .kitchen-layout h2 {
          color: white;
          margin-top: 0;
          margin-bottom: 24px;
        }
        .ticket-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: flex-start;
        }
        .no-tickets {
          color: hsl(215, 20%, 65%);
          font-size: 1.1rem;
        }
        .ticket {
          width: 320px;
          background: hsl(220, 30%, 12%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 8px;
          overflow: hidden;
        }
        .ticket-header {
          background: hsl(222, 35%, 10%);
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid hsl(217, 20%, 16%);
        }
        .ticket-table {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .ticket-id {
          color: hsl(215, 20%, 50%);
          font-size: 0.85rem;
          font-family: monospace;
        }
        .ticket-items {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .t-item {
          padding: 12px;
          border-radius: 6px;
          background: hsl(220, 25%, 14%);
          border-left: 4px solid transparent;
        }
        .t-item.status-pending { border-left-color: hsl(0, 84%, 60%); }
        .t-item.status-cooking { border-left-color: hsl(43, 96%, 56%); }
        .t-item.status-ready { border-left-color: hsl(142, 76%, 55%); opacity: 0.6; }
        
        .t-item-main {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 8px;
        }
        .qty { color: hsl(43, 96%, 56%); }
        .t-notes {
          font-size: 0.85rem;
          color: hsl(0, 84%, 70%);
          background: hsl(0, 84%, 60%, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .t-actions button {
          width: 100%;
          padding: 8px;
          border: 1px solid hsl(217, 20%, 20%);
          background: hsl(220, 25%, 18%);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .t-actions button:hover { background: hsl(217, 20%, 22%); }
        .t-actions .ready-btn {
          background: hsl(142, 76%, 45%, 0.2);
          border-color: hsl(142, 76%, 55%);
          color: hsl(142, 76%, 60%);
        }
        .t-actions .ready-btn:hover { background: hsl(142, 76%, 45%, 0.3); }
      `}</style>
    </div>
  );
}
