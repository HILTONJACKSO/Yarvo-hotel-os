'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncOfflineMutations, downloadLatestData } from '@/lib/sync';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/lib/auth-provider';
import { useCurrency } from '@/lib/currency';
import { Plus, Minus, Edit, ArrowRightLeft, Trash2, Search, PackagePlus, Printer } from 'lucide-react';
const API_URL = '';

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
  stockBoutique: string;
  minThreshold: string;
  costPerUnit: string;
};

export default function InventoryPage() {
  const { user } = useAuth();
  const { format, currencySymbol } = useCurrency();
  const userRoles = (user?.roles || []).map((r: any) => 
    (typeof r === 'string' ? r : r?.name || '').toUpperCase()
  );
  const isAdmin = userRoles.some(r => ['ADMIN', 'SUPER_ADMIN', 'CEO'].includes(r));
  const canManageInventory = userRoles.length === 0 || userRoles.some(r => 
    ['ADMIN', 'SUPER_ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR', 'INVENTORY_MANAGER', 'STOREKEEPER'].includes(r)
  );
  const canDeleteInventory = userRoles.some(r => 
    ['ADMIN', 'SUPER_ADMIN', 'CEO', 'MANAGER'].includes(r)
  );
  const canEdit = canManageInventory || !userRoles.some(r => r === 'POS');
  const canPrint = true;
  
  const { showToast } = useToast();
  const items = useLiveQuery(() => db.inventory.toArray()) || [];
  const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printReportPeriod, setPrintReportPeriod] = useState('WEEKLY');
  const [printReportDate, setPrintReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [printEndDate, setPrintEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [printLocation, setPrintLocation] = useState('ALL');

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    let headersHtml = '';
    if (printLocation === 'ALL') {
      headersHtml = `<th>Item Name</th><th>Category</th><th>Unit</th><th>Main</th><th>Kitchen</th><th>Bar</th><th>H.Keeping</th><th>Boutique</th><th>Total Stock</th><th>Cost/Unit</th><th>Total Value</th>`;
    } else {
      headersHtml = `<th>Item Name</th><th>Category</th><th>Unit</th><th>${printLocation.charAt(0) + printLocation.slice(1).toLowerCase()} Stock</th><th>Cost/Unit</th><th>Value</th>`;
    }

    let rowsHtml = '';
    let grandTotalValue = 0;
    
    // Filter items based on location
    const filteredItems = items.filter(item => {
      if (printLocation === 'ALL') return true;
      if (printLocation === 'BAR') return item.category === 'DRINK' || item.category === 'BAR' || Number(item.stockBar || 0) > 0;
      if (printLocation === 'KITCHEN') return item.category === 'FOOD' || item.category === 'KITCHEN' || Number(item.stockKitchen || 0) > 0;
      if (printLocation === 'BOUTIQUE') return item.category === 'BOUTIQUE' || Number(item.stockBoutique || 0) > 0;
      if (printLocation === 'HOUSEKEEPING') return item.category === 'HOUSEKEEPING' || Number(item.stockHousekeeping || 0) > 0;
      if (printLocation === 'MAIN') return item.category === 'GENERAL' || item.category === 'MAINTENANCE' || Number(item.stockMain || 0) > 0;
      return false;
    });

    // Sort items by category then name
    const sortedItems = [...filteredItems].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    sortedItems.forEach(item => {
      const cost = Number(item.costPerUnit || 0);
      let cols = '';
      if (printLocation === 'ALL') {
        const totalStock = Number(item.stockLevel || 0);
        const itemVal = totalStock * cost;
        grandTotalValue += itemVal;
        cols = `
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.unit}</td>
          <td>${Number(item.stockMain || 0).toFixed(2)}</td>
          <td>${Number(item.stockKitchen || 0).toFixed(2)}</td>
          <td>${Number(item.stockBar || 0).toFixed(2)}</td>
          <td>${Number(item.stockHousekeeping || 0).toFixed(2)}</td>
          <td>${Number(item.stockBoutique || 0).toFixed(2)}</td>
          <td><strong>${totalStock.toFixed(2)}</strong></td>
          <td>${currencySymbol} ${cost.toFixed(2)}</td>
          <td><strong>${currencySymbol} ${itemVal.toFixed(2)}</strong></td>
        `;
      } else {
        let val = 0;
        if (printLocation === 'MAIN') val = Number(item.stockMain || 0);
        else if (printLocation === 'BAR') val = Number(item.stockBar || 0);
        else if (printLocation === 'KITCHEN') val = Number(item.stockKitchen || 0);
        else if (printLocation === 'HOUSEKEEPING') val = Number(item.stockHousekeeping || 0);
        else if (printLocation === 'BOUTIQUE') val = Number(item.stockBoutique || 0);
        const itemVal = val * cost;
        grandTotalValue += itemVal;

        cols = `
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${item.unit}</td>
          <td><strong>${val.toFixed(2)}</strong></td>
          <td>${currencySymbol} ${cost.toFixed(2)}</td>
          <td><strong>${currencySymbol} ${itemVal.toFixed(2)}</strong></td>
        `;
      }
      rowsHtml += `<tr>${cols}</tr>`;
    });

    const propertyName = user?.propertyName || 'Hotel Stock & Inventory';

    doc.open();
    doc.write(`
      <html>
      <head>
        <title>${propertyName} - Inventory Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; }
          .header-box { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
          h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
          .meta { font-size: 13px; color: #64748b; margin: 3px 0; }
          .summary-card { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .total-row { font-weight: bold; background-color: #e2e8f0 !important; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>${propertyName}</h1>
          <div class="meta"><strong>Inventory Stock & Valuation Report</strong> (${printReportPeriod})</div>
          <div class="meta">Department Scope: <strong>${printLocation === 'ALL' ? 'All Hotel Departments' : printLocation}</strong> | Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="summary-card">
          <span>Total Catalog Items: <strong>${sortedItems.length}</strong></span>
          <span>Valuation: <strong>${currencySymbol} ${grandTotalValue.toFixed(2)}</strong></span>
        </div>
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="11" style="text-align:center;padding:20px;color:#94a3b8;">No inventory items found for this department.</td></tr>'}
            ${sortedItems.length > 0 ? `<tr class="total-row"><td colspan="${printLocation === 'ALL' ? 10 : 5}" style="text-align:right;">Grand Total Stock Value:</td><td><strong>${currencySymbol} ${grandTotalValue.toFixed(2)}</strong></td></tr>` : ''}
          </tbody>
        </table>
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { document.body.removeChild(iframe); setShowPrintModal(false); }, 1000);
    }, 250);
  };

  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);

  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [transferData, setTransferData] = useState({ from: 'MAIN', to: 'BAR', amount: 0 });
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [stockInData, setStockInData] = useState({ amount: 0, costPerUnit: 0 });
  const [stockOutData, setStockOutData] = useState({ amount: 0, staffName: '', reason: '', location: 'MAIN' });

  const [newItem, setNewItem] = useState({ name: '', category: 'GENERAL', unit: '', stockLevel: 0, minThreshold: 10, costPerUnit: 0 });

  const fetchItems = async () => {
    if (navigator.onLine) await downloadLatestData();
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
      const jsonRes = await res.json().catch(() => null);
      const saved = jsonRes?.data || jsonRes;
      if (saved && saved.id) {
        await db.inventory.put(saved);
      }
      showToast(`Inventory item ${editItemId ? 'updated' : 'created'} successfully`, 'success', 'Success');
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
      await db.inventory.delete(itemToDelete.id);
      showToast('Item deleted successfully', 'success', 'Success');
      setItemToDelete(null);
      fetchItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', 'error', 'Error');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem) return;
    const amount = Number(transferData.amount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid transfer amount greater than 0', 'error', 'Invalid Amount');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/inventory/${transferItem.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          from: transferData.from,
          to: transferData.to,
          amount
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to transfer');
      }
      const jsonRes = await res.json().catch(() => null);
      const updated = jsonRes?.data || jsonRes;
      if (updated && updated.id) {
        await db.inventory.put(updated);
      }
      showToast(`Transferred ${amount} ${transferItem.unit} to ${transferData.to} successfully`, 'success', 'Transfer Complete');
      setShowTransferModal(false);
      setTransferItem(null);
      setTransferData({ from: 'MAIN', to: 'BAR', amount: 0 });
      fetchItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer', 'error', 'Transfer Failed');
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;
    const amount = Number(stockInData.amount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error', 'Invalid Amount');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/inventory/${stockItem.id}/stock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          costPerUnit: Number(stockInData.costPerUnit || 0)
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to stock in');
      }
      const jsonRes = await res.json().catch(() => null);
      const updated = jsonRes?.data || jsonRes;
      if (updated && updated.id) {
        await db.inventory.put(updated);
      }
      showToast(`Added ${amount} ${stockItem.unit} to stock successfully`, 'success', 'Stock Added');
      setShowStockInModal(false);
      setStockItem(null);
      setStockInData({ amount: 0, costPerUnit: 0 });
      fetchItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to stock in', 'error', 'Stock In Failed');
    }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;
    const amount = Number(stockOutData.amount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error', 'Invalid Amount');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/inventory/${stockItem.id}/stock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          staffName: stockOutData.staffName,
          reason: stockOutData.reason,
          location: stockOutData.location
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to stock out');
      }
      const jsonRes = await res.json().catch(() => null);
      const updated = jsonRes?.data || jsonRes;
      if (updated && updated.id) {
        await db.inventory.put(updated);
      }
      showToast(`Stock reduced by ${amount} ${stockItem.unit} successfully`, 'success', 'Stock Reduced');
      setShowStockOutModal(false);
      setStockItem(null);
      setStockOutData({ amount: 0, staffName: '', reason: '', location: 'MAIN' });
      fetchItems();
    } catch (err: any) {
      showToast(err.message || 'Failed to stock out', 'error', 'Stock Out Failed');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading inventory...</div>;

  const filteredItems = items
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  return (
    <div className="inventory-layout">
      <div className="inv-header">
        <h2>Inventory Management</h2>
        <div className="header-actions">
          <div className="search-bar-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          {canPrint && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setShowPrintModal(true)}
              title="Print stock inventory report"
            >
              <Printer size={17} />
              <span>Print Report</span>
            </button>
          )}
          {canManageInventory && (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => {
                setEditItemId(null);
                setNewItem({ name: '', category: 'GENERAL', unit: '', stockLevel: 0, minThreshold: 10, costPerUnit: 0 });
                setShowAddModal(true);
              }}
              title="Add a new item to your inventory catalog"
            >
              <Plus size={18} />
              <span>Add Inventory Item</span>
            </button>
          )}
        </div>
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
                <th>Boutique</th>
              <th>Status</th>
              <th>Cost/Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={11} className="empty-state-cell">
                  <div className="empty-inventory-state">
                    <PackagePlus size={44} className="empty-icon" />
                    <h4 className="empty-title">
                      {searchQuery ? 'No matching inventory items' : 'No inventory items found'}
                    </h4>
                    <p className="empty-desc">
                      {searchQuery 
                        ? `No inventory items matched "${searchQuery}". Clear your search query to see all items.` 
                        : 'Your inventory catalog is currently empty. Add your first hotel stock item to begin tracking stock across Main Storage, Kitchen, Bar, Housekeeping, and Boutique.'}
                    </p>
                    {canManageInventory && !searchQuery && (
                      <button 
                        type="button" 
                        className="btn-primary empty-btn"
                        onClick={() => {
                          setEditItemId(null);
                          setNewItem({ name: '', category: 'GENERAL', unit: '', stockLevel: 0, minThreshold: 10, costPerUnit: 0 });
                          setShowAddModal(true);
                        }}
                      >
                        <Plus size={16} />
                        <span>Add First Inventory Item</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {filteredItems.map(item => {
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
                  <td>{Number(item.stockBoutique || 0).toFixed(2)}</td>
                  <td>
                    {isLow ? <span className="badge badge-error">Low Stock</span> : <span className="badge badge-success">OK</span>}
                  </td>
                  <td>{format(Number(item.costPerUnit))}</td>
                  <td>
                    <div className="action-buttons">
                      {canEdit && (
                        <>
                          <button title="Stock In (Add)" className="btn-icon" style={{ color: 'hsl(142, 76%, 55%)' }} onClick={() => {
                            setStockItem(item);
                            setStockInData({ amount: 0, costPerUnit: Number(item.costPerUnit) || 0 });
                            setShowStockInModal(true);
                          }}>
                            <Plus size={16} />
                          </button>
                          <button title="Stock Out (Remove)" className="btn-icon" style={{ color: 'hsl(0, 84%, 65%)' }} onClick={() => {
                            const initLoc = Number(item.stockMain || 0) > 0 ? 'MAIN'
                              : Number(item.stockBar || 0) > 0 ? 'BAR'
                              : Number(item.stockKitchen || 0) > 0 ? 'KITCHEN'
                              : Number(item.stockHousekeeping || 0) > 0 ? 'HOUSEKEEPING'
                              : Number(item.stockBoutique || 0) > 0 ? 'BOUTIQUE'
                              : 'MAIN';
                            setStockItem(item);
                            setStockOutData({ amount: 0, staffName: '', reason: '', location: initLoc });
                            setShowStockOutModal(true);
                          }}>
                            <Minus size={16} />
                          </button>
                        </>
                      )}
                      {canEdit && (
                        <button title="Edit Item Details" className="btn-icon" onClick={() => {
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
                        }}>
                          <Edit size={16} />
                        </button>
                      )}
                      <button title="Transfer Stock" className="btn-icon" onClick={() => { setTransferItem(item); setShowTransferModal(true); }}>
                        <ArrowRightLeft size={16} />
                      </button>
                      {canDeleteInventory && (
                        <button title="Delete Item" className="btn-icon" onClick={() => setItemToDelete(item)} style={{ color: 'hsl(0, 84%, 65%)' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showStockInModal && stockItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Stock: {stockItem.name}</h3>
            <form onSubmit={handleStockIn}>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity to add ({stockItem.unit})</label>
                  <input required type="number" step="0.01" min="0.01" value={stockInData.amount} onChange={e => setStockInData({...stockInData, amount: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Cost per Unit ({currencySymbol}) - Optional</label>
                  <input required type="number" step="0.01" min="0" value={stockInData.costPerUnit} onChange={e => setStockInData({...stockInData, costPerUnit: Number(e.target.value)})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowStockInModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'hsl(142, 76%, 45%)', color: 'white' }}>Save Stock In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockOutModal && stockItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Stock Out: {stockItem.name}</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 16px 0' }}>
              Total Hotel Available: <strong style={{ color: '#10b981' }}>{Number(stockItem.stockLevel || 0).toFixed(2)} {stockItem.unit}</strong>
            </p>
            <form onSubmit={handleStockOut}>
              <div className="form-row">
                <div className="form-group">
                  <label>Deduct From Department / Storage</label>
                  <select required value={stockOutData.location} onChange={e => setStockOutData({...stockOutData, location: e.target.value})}>
                    <option value="MAIN">Main Storage ({Number(stockItem.stockMain || 0).toFixed(2)} {stockItem.unit})</option>
                    <option value="BAR">Bar ({Number(stockItem.stockBar || 0).toFixed(2)} {stockItem.unit})</option>
                    <option value="KITCHEN">Kitchen ({Number(stockItem.stockKitchen || 0).toFixed(2)} {stockItem.unit})</option>
                    <option value="HOUSEKEEPING">Housekeeping ({Number(stockItem.stockHousekeeping || 0).toFixed(2)} {stockItem.unit})</option>
                    <option value="BOUTIQUE">Boutique ({Number(stockItem.stockBoutique || 0).toFixed(2)} {stockItem.unit})</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity to remove ({stockItem.unit})</label>
                  <input required type="number" step="0.01" min="0.01" max={Math.max(0.01, Number(stockItem.stockLevel || 0))} value={stockOutData.amount} onChange={e => setStockOutData({...stockOutData, amount: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Staff Approving</label>
                  <input required type="text" placeholder="e.g. Staff Name" value={stockOutData.staffName} onChange={e => setStockOutData({...stockOutData, staffName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Reason (Optional)</label>
                  <input type="text" placeholder="e.g. Guest consumption, Bar service, Expired" value={stockOutData.reason} onChange={e => setStockOutData({...stockOutData, reason: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowStockOutModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'hsl(0, 84%, 60%)', color: 'white' }}>Confirm Stock Out</button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* PRINT MODAL */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3>Print Inventory Report</h3>
            <div className="form-group">
              <label>Report Period</label>
              <select value={printReportPeriod} onChange={e => setPrintReportPeriod(e.target.value)} className="form-select w-full">
                <option value="WEEKLY">Weekly Record</option>
                <option value="MONTHLY">Monthly Record</option>
                <option value="ANNUAL">Annual Record</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
                <input type="date" value={printReportDate} onChange={e => setPrintReportDate(e.target.value)} className="form-control w-full" />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} className="form-control w-full" />
            </div>
            <div className="form-group">
              <label>Department / Location</label>
              <select value={printLocation} onChange={e => setPrintLocation(e.target.value)} className="form-select w-full">
                <option value="ALL">All Stock</option>
                <option value="MAIN">Main Stock</option>
                <option value="BAR">Bar Stock</option>
                <option value="KITCHEN">Kitchen Stock</option>
                <option value="HOUSEKEEPING">Housekeeping Stock</option>
                <option value="BOUTIQUE">Boutique Stock</option>
              </select>
            </div>
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-cancel" onClick={() => setShowPrintModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handlePrint}>Print Now</button>
            </div>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editItemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h3>
            <p style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', marginBottom: '16px' }}>
              {editItemId ? 'Update item details, category, threshold, and unit cost.' : 'Define a new inventory item with its unit of measurement, initial stock, and cost per unit.'}
            </p>
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
                  <option value="BOUTIQUE">Boutique</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input required type="text" list="inventory-units" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} placeholder="e.g. kg, bottles" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Stock (Leave 0 if unsure)</label>
                  <input type="number" step="0.01" value={newItem.stockLevel} onChange={e => setNewItem({...newItem, stockLevel: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>Low Threshold</label>
                  <input type="number" step="0.01" value={newItem.minThreshold} onChange={e => setNewItem({...newItem, minThreshold: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label>Cost Per Unit ({currencySymbol})</label>
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
            <p style={{ color: 'hsl(215, 20%, 65%)', fontSize: '13px', marginBottom: '16px' }}>
              Move physical stock between hotel storage locations. Total Item Stock: <strong>{Number(transferItem.stockLevel || 0).toFixed(2)} {transferItem.unit}</strong>
            </p>
            <form onSubmit={handleTransfer}>
              <div className="form-row">
                <div className="form-group">
                  <label>From (Source Storage)</label>
                  <select required value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                    <option value="MAIN">Main Storage ({(() => {
                      const total = Number(transferItem.stockLevel || 0);
                      const other = Number(transferItem.stockKitchen || 0) + Number(transferItem.stockBar || 0) + Number(transferItem.stockHousekeeping || 0) + Number(transferItem.stockBoutique || 0);
                      return Math.max(Number(transferItem.stockMain || 0), Math.max(0, total - other)).toFixed(2);
                    })()} available)</option>
                    <option value="BAR">Bar ({Number(transferItem.stockBar || 0).toFixed(2)} available)</option>
                    <option value="KITCHEN">Kitchen ({Number(transferItem.stockKitchen || 0).toFixed(2)} available)</option>
                    <option value="HOUSEKEEPING">Housekeeping ({Number(transferItem.stockHousekeeping || 0).toFixed(2)} available)</option>
                    <option value="BOUTIQUE">Boutique ({Number(transferItem.stockBoutique || 0).toFixed(2)} available)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>To (Destination)</label>
                  <select required value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                    <option value="BAR">Bar Storage</option>
                    <option value="KITCHEN">Kitchen Storage</option>
                    <option value="MAIN">Main Storage</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="BOUTIQUE">Boutique</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Amount to transfer ({transferItem.unit})</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  placeholder="Enter amount..."
                  value={transferData.amount === 0 ? '' : transferData.amount} 
                  onChange={e => setTransferData({...transferData, amount: Number(e.target.value)})} 
                />
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
          flex-wrap: wrap;
          gap: 16px;
        }
        .inv-header h2 { margin: 0; color: white; }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .search-bar-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: hsl(215, 20%, 65%);
        }
        .search-input {
          background: hsl(220, 30%, 8%);
          border: 1px solid hsl(217, 20%, 20%);
          color: white;
          padding: 10px 12px 10px 38px;
          border-radius: 6px;
          outline: none;
          width: 250px;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: hsl(43,96%,56%);
          width: 280px;
        }
        
        .btn-primary {
          background: hsl(43,96%,56%);
          color: hsl(224, 39%, 6%);
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: hsl(43,96%,60%); }

        .btn-secondary {
          background: hsl(220, 25%, 16%);
          color: white;
          border: 1px solid hsl(217, 20%, 30%);
          padding: 10px 18px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: hsl(217, 20%, 24%);
          border-color: hsl(217, 20%, 40%);
        }
        
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
        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid hsl(217, 20%, 20%);
          background: hsl(220, 25%, 16%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .btn-icon:hover { background: hsl(217, 20%, 26%); }

        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .text-center { text-align: center; color: hsl(215, 20%, 50%); padding: 32px !important; }

        .empty-state-cell {
          padding: 56px 24px !important;
          text-align: center;
        }
        .empty-inventory-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          max-width: 520px;
          margin: 0 auto;
          text-align: center;
        }
        .empty-icon {
          color: hsl(43, 96%, 56%);
          opacity: 0.85;
          margin-bottom: 16px;
        }
        .empty-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: white;
          margin: 0 0 8px 0;
        }
        .empty-desc {
          font-size: 0.9rem;
          color: hsl(215, 20%, 65%);
          line-height: 1.5;
          margin: 0 0 20px 0;
        }
        .empty-btn {
          margin: 0 auto;
        }

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
      `}</style>
    </div>
  );
}
