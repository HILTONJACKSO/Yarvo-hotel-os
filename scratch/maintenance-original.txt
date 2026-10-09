'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';

type WorkOrder = {
  id: string;
  roomId?: string;
  room?: { number: string };
  type: 'MAINTENANCE' | 'HOUSEKEEPING';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  createdAt: string;
};

export default function MaintenancePage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newRoomId, setNewRoomId] = useState(''); // Optional

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/work-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          console.error("API did not return an array", data);
          setOrders([]);
        }
      } else {
        console.error("API returned error", res.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MAINTENANCE',
          priority: newPriority,
          description: newDesc,
          roomId: newRoomId || undefined,
        }),
      });

      if (res.ok) {
        showToast('Work order created!', 'success', 'Success');
        setNewDesc('');
        setNewRoomId('');
        setNewPriority('MEDIUM');
        fetchOrders();
      } else {
        const err = await res.json();
        showToast(`Failed: ${err.message}`, 'error', 'Error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/work-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'URGENT') return 'badge-urgent';
    if (p === 'HIGH') return 'badge-high';
    if (p === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  if (loading) return <div className="loading-state">Loading Work Orders...</div>;

  return (
    <div className="maintenance-layout">
      {/* Create Form */}
      <div className="create-panel">
        <h3>Report Issue</h3>
        <form onSubmit={handleCreate} className="create-form">
          <div className="form-group">
            <label>Description</label>
            <textarea 
              required 
              rows={3} 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)}
              placeholder="E.g., AC leaking, lightbulb out..."
            />
          </div>
          
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Priority</label>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">URGENT (Locks Room)</option>
              </select>
            </div>
            
            <div className="form-group flex-1">
              <label>Room UUID (Optional)</label>
              <input 
                type="text" 
                placeholder="Leave blank if property issue" 
                value={newRoomId} 
                onChange={e => setNewRoomId(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create Work Order</button>
          </div>
        </form>
      </div>

      {/* Kanban/List Board */}
      <div className="board-panel">
        <h3>Active Work Orders</h3>
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <p className="empty-text">No active work orders</p>
              <p className="empty-subtext">The property is in perfect condition.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className={`priority-badge ${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                  <span className="order-room">
                    {order.room ? `Room ${order.room.number}` : 'Property Area'}
                  </span>
                </div>
                <p className="order-desc">{order.description}</p>
                
                <div className="order-actions">
                  <div className="status-indicator">Status: <strong>{order.status}</strong></div>
                  {order.status === 'PENDING' && (
                    <button className="btn-start" onClick={() => handleStatusUpdate(order.id, 'IN_PROGRESS')}>Start Work</button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <button className="btn-resolve" onClick={() => handleStatusUpdate(order.id, 'RESOLVED')}>Mark Resolved</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .maintenance-layout { display: flex; gap: 32px; align-items: flex-start; padding: 8px; }
        
        .create-panel { width: 380px; background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); flex-shrink: 0; }
        .create-panel h3 { margin: 0 0 24px 0; color: hsl(210, 40%, 96%); font-size: 1.25rem; }
        .create-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.75rem; color: hsl(215, 20%, 65%); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; min-width: 0; }
        
        .create-form input, .create-form select, .create-form textarea {
          width: 100%; box-sizing: border-box; background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 20%); color: hsl(210, 40%, 96%); padding: 12px 14px; border-radius: 8px; outline: none; font-family: inherit; font-size: 0.875rem; transition: border-color 0.2s;
        }
        .create-form input:focus, .create-form select:focus, .create-form textarea:focus { border-color: hsl(43, 96%, 56%); }
        
        .form-actions { margin-top: 8px; }
        .btn-primary { width: 100%; background: hsl(43, 96%, 56%); color: hsl(224, 39%, 6%); border: none; padding: 12px; border-radius: 8px; font-weight: 600; font-size: 0.9375rem; cursor: pointer; transition: background 0.2s; }
        .btn-primary:hover { background: hsl(43, 96%, 60%); }

        .board-panel { flex: 1; background: transparent; }
        .board-panel h3 { margin: 0 0 24px 0; color: hsl(210, 40%, 96%); font-size: 1.25rem; }
        
        .orders-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .order-card { background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; transition: transform 0.2s; }
        .order-card:hover { transform: translateY(-2px); border-color: hsl(217, 20%, 25%); }
        
        .order-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .order-room { color: hsl(210, 40%, 96%); font-weight: 700; font-size: 1.125rem; letter-spacing: -0.01em; }
        
        .priority-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .badge-urgent { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.3); animation: pulse 2s infinite; }
        .badge-high { background: hsl(35, 100%, 50%, 0.15); color: hsl(35, 100%, 65%); border: 1px solid hsl(35, 100%, 50%, 0.3); }
        .badge-medium { background: hsl(210, 100%, 50%, 0.15); color: hsl(210, 100%, 70%); border: 1px solid hsl(210, 100%, 50%, 0.3); }
        .badge-low { background: hsl(215, 20%, 50%, 0.15); color: hsl(215, 20%, 70%); border: 1px solid hsl(215, 20%, 50%, 0.3); }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 hsl(0, 84%, 60%, 0.4); }
          70% { box-shadow: 0 0 0 6px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }

        .order-desc { margin: 0; color: hsl(215, 20%, 75%); font-size: 0.9375rem; line-height: 1.5; flex-grow: 1; }
        
        .order-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid hsl(217, 20%, 16%); padding-top: 16px; margin-top: 4px; }
        .status-indicator { font-size: 0.8125rem; color: hsl(215, 20%, 60%); display: flex; align-items: center; gap: 6px; }
        .status-indicator strong { color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .btn-start { background: hsl(210, 100%, 50%, 0.15); border: 1px solid hsl(210, 100%, 50%, 0.3); color: hsl(210, 100%, 70%); padding: 8px 16px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-start:hover { background: hsl(210, 100%, 50%, 0.25); }
        
        .btn-resolve { background: hsl(142, 76%, 36%, 0.15); border: 1px solid hsl(142, 76%, 36%, 0.3); color: hsl(142, 76%, 50%); padding: 8px 16px; border-radius: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-resolve:hover { background: hsl(142, 76%, 36%, 0.25); }
        
        .empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: hsl(222, 35%, 10%); border: 1px dashed hsl(217, 20%, 20%); border-radius: 12px; padding: 60px 20px; text-align: center; gap: 12px; }
        .empty-icon { width: 48px; height: 48px; border-radius: 24px; background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 50%); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 8px; }
        .empty-text { margin: 0; color: hsl(210, 40%, 96%); font-size: 1.125rem; font-weight: 600; }
        .empty-subtext { margin: 0; color: hsl(215, 20%, 60%); font-size: 0.9375rem; }
        
        .loading-state { text-align: center; padding: 60px; color: hsl(215, 20%, 60%); font-size: 1.125rem; }
      `}</style>
    </div>
  );
}

