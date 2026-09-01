'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stockLevel: string;
  stockMain: string;
  stockKitchen: string;
  stockBar: string;
  stockHousekeeping: string;
  minThreshold: string;
  costPerUnit: string;
};

export default function InventoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [transferData, setTransferData] = useState({ from: 'MAIN', to: 'BAR', amount: 0 });
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState({ name: '', category: 'GENERAL', unit: '', stockLevel: 0, minThreshold: 10, costPerUnit: 0 });

  const fetchItems = () => {
    fetch(`${API_URL}/api/v1/inventory`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
      })
      .then(data => {
        const result = data.data || data;
        setItems(Array.isArray(result) ? result : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setItems([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editItemId ? 'PATCH' : 'POST';
      const url = editItemId ? `${API_URL}/api/v1/inventory/${editItemId}` : `${API_URL}/api/v1/inventory`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newItem)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to ${editItemId ? 'update' : 'create'} item`);
      }
      showToast(`Inventory item ${editItemId ? 'updated' : 'created'}`, 'success', 'Success');
      setShowAddModal(false);
      setNewItem({ name: '', category: 'GENERAL', unit: '', stockLevel: 0, minThreshold: 10, costPerUnit: 0 });
      setEditItemId(null);
      fetchItems();
    } catch (err: any) {
      showToast(err.message || `Failed to ${editItemId ? 'update' : 'create'} item`, 'error', 'Error');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/inventory/${itemToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete item');
      }
      showToast('Item deleted successfully', 'success', 'Success');
      setItemToDelete(null);
      fetchItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', 'error', 'Error');
    }
  };

  const updateStock = async (id: string, amount: number) => {
    try {
      await fetch(`${API_URL}/api/v1/inventory/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount })
      });
      fetchItems();
    } catch (err) {
      showToast('Failed to update stock', 'error', 'Error');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/inventory/${transferItem.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transferData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to transfer');
      }
      showToast('Stock transferred successfully', 'success');
      setShowTransferModal(false);
      setTransferItem(null);
      setTransferData({ from: 'MAIN', to: 'BAR', amount: 0 });
      fetchItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer', 'error');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading inventory...</div>;

  return (
    <div className="inventory-layout">
      <div className="inv-header">
        <h2>Inventory Management</h2>
        <button className="btn-primary" onClick={() => {
          setEditItemId(null);
          setNewItem({ name: '', category: 'GENERAL', unit: '', stockLevel: 0, minThreshold: 10, costPerUnit: 0 });
          setShowAddModal(true);
        }}>+ Add Item</button>
      </div>

      <div className="inv-table-container">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Total Stock</th>
              <th>Main</th>
              <th>Kitchen</th>
              <th>Bar</th>
              <th>H.Keeping</th>
              <th>Status</th>
              <th>Cost/Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center">No inventory items found.</td>
              </tr>
            )}
            {items.map(item => {
              const stock = Number(item.stockLevel);
              const min = Number(item.minThreshold);
              const isLow = stock <= min;

              return (
                <tr key={item.id} className={isLow ? 'row-warning' : ''}>
                  <td className="font-medium">{item.name}</td>
                  <td className="text-sm" style={{ color: 'hsl(215, 20%, 65%)' }}>{item.category}</td>
                  <td>{item.unit}</td>
                  <td className="font-bold">{stock.toFixed(2)}</td>
                  <td>{Number(item.stockMain || 0).toFixed(2)}</td>
                  <td>{Number(item.stockKitchen || 0).toFixed(2)}</td>
                  <td>{Number(item.stockBar || 0).toFixed(2)}</td>
                  <td>{Number(item.stockHousekeeping || 0).toFixed(2)}</td>
                  <td>
                    {isLow ? <span className="badge badge-error">Low Stock</span> : <span className="badge badge-success">OK</span>}
                  </td>
                  <td>${Number(item.costPerUnit).toFixed(2)}</td>
                  <td>
                    <div className="action-buttons">
                      <button title="Edit Item" onClick={() => {
                        setEditItemId(item.id);
                        setNewItem({
                          name: item.name,
                          category: item.category,
                          unit: item.unit,
                          stockLevel: Number(item.stockLevel),
                          minThreshold: Number(item.minThreshold),
                          costPerUnit: Number(item.costPerUnit)
                        });
                        setShowAddModal(true);
                      }}>✎</button>
                      <button title="Transfer Stock" onClick={() => { setTransferItem(item); setShowTransferModal(true); }}>⇄</button>
                      <button title="Delete Item" onClick={() => setItemToDelete(item)} style={{ color: 'hsl(0, 84%, 65%)' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editItemId ? 'Edit' : 'Add'} Inventory Item</h3>
            <datalist id="inventory-names">
              {Array.from(new Set(items.map(i => i.name))).map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <datalist id="inventory-units">
              {Array.from(new Set(items.map(i => i.unit))).map(unit => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>Name</label>
                <input required type="text" list="inventory-names" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Tomatoes" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  <option value="GENERAL">General</option>
                  <option value="FOOD">Food</option>
                  <option value="DRINK">Drink</option>
                  <option value="HOUSEKEEPING">Housekeeping</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input required type="text" list="inventory-units" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} placeholder="e.g. kg, bottles" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" step="0.01" value={newItem.stockLevel} onChange={e => setNewItem({...newItem, stockLevel: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Low Threshold</label>
                  <input type="number" step="0.01" value={newItem.minThreshold} onChange={e => setNewItem({...newItem, minThreshold: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label>Cost Per Unit ($)</label>
                <input type="number" step="0.01" value={newItem.costPerUnit} onChange={e => setNewItem({...newItem, costPerUnit: Number(e.target.value)})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && transferItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Transfer Stock: {transferItem.name}</h3>
            <form onSubmit={handleTransfer}>
              <div className="form-row">
                <div className="form-group">
                  <label>From</label>
                  <select required value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                    <option value="MAIN">Main Storage</option>
                    <option value="KITCHEN">Kitchen</option>
                    <option value="BAR">Bar</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>To</label>
                  <select required value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                    <option value="MAIN">Main Storage</option>
                    <option value="KITCHEN">Kitchen</option>
                    <option value="BAR">Bar</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Amount to transfer ({transferItem.unit})</label>
                <input required type="number" step="0.01" min="0.01" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: Number(e.target.value)})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Transfer Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Item</h3>
            <p style={{ color: 'hsl(215, 20%, 65%)', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{itemToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setItemToDelete(null)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ background: 'hsl(0, 84%, 60%)', color: 'white' }} onClick={handleDelete}>Delete Item</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .inventory-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .inv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .inv-header h2 { margin: 0; color: white; }
        .btn-primary {
          background: hsl(43,96%,56%);
          color: hsl(224, 39%, 6%);
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-primary:hover { background: hsl(43,96%,60%); }
        .btn-cancel {
          background: transparent;
          color: hsl(215, 20%, 65%);
          border: 1px solid hsl(217, 20%, 30%);
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .inv-table-container {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
          color: hsl(210, 40%, 96%);
          min-width: 900px;
        }
        .inv-table th {
          text-align: left;
          padding: 16px;
          background: hsl(220, 30%, 12%);
          color: hsl(215, 20%, 65%);
          font-weight: 500;
          font-size: 0.875rem;
          border-bottom: 1px solid hsl(217, 20%, 16%);
        }
        .inv-table td {
          padding: 16px;
          border-bottom: 1px solid hsl(217, 20%, 16%);
          font-size: 0.95rem;
        }
        .inv-table tr:last-child td { border-bottom: none; }
        .inv-table tr:hover td { background: hsl(220, 25%, 14%); }
        
        .row-warning td {
          background: hsl(0, 84%, 60%, 0.05);
        }
        .row-warning:hover td {
          background: hsl(0, 84%, 60%, 0.08);
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-success { background: hsl(142, 76%, 45%, 0.2); color: hsl(142, 76%, 55%); border: 1px solid hsl(142, 76%, 45%, 0.3); }
        .badge-error { background: hsl(0, 84%, 60%, 0.2); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.3); }

        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .action-buttons button {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid hsl(217, 20%, 20%);
          background: hsl(220, 25%, 16%);
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-buttons button:hover { background: hsl(217, 20%, 22%); }

        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .text-center { text-align: center; color: hsl(215, 20%, 50%); padding: 32px !important; }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .modal-content {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 480px;
        }
        .modal-content h3 { margin: 0 0 24px 0; color: white; }
        .form-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .form-row .form-group { flex: 1; }
        .form-group label {
          color: hsl(215, 20%, 65%);
          font-size: 0.875rem;
        }
        .form-group input, .form-group select {
          width: 100%;
          box-sizing: border-box;
          background: hsl(220, 30%, 8%);
          border: 1px solid hsl(217, 20%, 20%);
          color: white;
          padding: 10px 12px;
          border-radius: 6px;
          outline: none;
        }
        
        /* Hide number spinners */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        
        .form-group input:focus, .form-group select:focus { border-color: hsl(43,96%,56%); }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
        }

        @media (max-width: 768px) {
          .inv-header { flex-direction: column; align-items: stretch; gap: 16px; }
          .btn-primary { width: 100%; }
        }
      `}</style>
    </div>
  );
}

