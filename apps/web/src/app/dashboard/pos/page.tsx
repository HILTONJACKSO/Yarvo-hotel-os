'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/lib/auth-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PosCategory = { id: string; name: string };
type PosMenuItem = { id: string; name: string; price: string; isAvailable: boolean; categoryId: string; type: string; image?: string; recipes?: { inventoryItemId: string }[] };
type PosTable = { id: string; number: string; capacity: number; status: string };
type Reservation = { id: string; folio: { id: string }; room: { number: string }; guest: { firstName: string; lastName: string } };
type ServedOrder = { id: string; status: string; totalAmount: string; table?: PosTable; folioId?: string; folio?: { reservation: { guest: { firstName: string; lastName: string }; room: { number: string } } }; items: any[]; user?: { firstName: string; lastName: string } };

export default function PosPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN'].includes(role?.toUpperCase?.() || (role as any)?.name?.toUpperCase?.()));
  const canEditPos = user?.roles?.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'CEO', 'MANAGER'].includes(role?.toUpperCase?.() || (role as any)?.name?.toUpperCase?.()));
  const canSeeDiscount = user?.roles?.some(role => ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'POS'].includes(role.toUpperCase()));
  const { showToast } = useToast();
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [tables, setTables] = useState<PosTable[]>([]);
  const [inHouseGuests, setInHouseGuests] = useState<Reservation[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{id: string, name: string, category: string}[]>([]);
  
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  
  const [orderDestinationType, setOrderDestinationType] = useState<'TABLE' | 'ROOM' | 'GUEST'>('TABLE');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [showCreateGuest, setShowCreateGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', companyName: '', address: '', phone: '', email: '', nationality: '' });

  const [cart, setCart] = useState<{item: PosMenuItem, quantity: number}[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [orderDestinationDept, setOrderDestinationDept] = useState<'KITCHEN'|'BAR'|'BOTH'>('KITCHEN');
  const [showOrderNotes, setShowOrderNotes] = useState<boolean>(false);
  
  // Checkout / Settle state
  const [settleDiscountPercent, setSettleDiscountPercent] = useState<number>(0);

  const [showAddTable, setShowAddTable] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: 2 });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<PosCategory | null>(null);

  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState<{name: string, price: number, categoryId: string, type: string, inventoryItemId: string, image: string, taxIds: string[]}>({ name: '', price: 0, categoryId: '', type: 'FOOD', inventoryItemId: '', image: '', taxIds: [] });
  const [editMenuItemId, setEditMenuItemId] = useState<string | null>(null);
  const [menuItemToDelete, setMenuItemToDelete] = useState<PosMenuItem | null>(null);

  // Cashier Settlement
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [servedOrders, setServedOrders] = useState<ServedOrder[]>([]);
  const [settleOrder, setSettleOrder] = useState<ServedOrder | null>(null);
  const [settleFolioId, setSettleFolioId] = useState<string | null>(null);
  
  const [payments, setPayments] = useState<{method: string, amount: number}[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PAYMENT_CASH');
  
  const [taxes, setTaxes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    Promise.all([
      fetch(`${API_URL}/api/v1/pos/categories`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/pos/menu-items`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/pos/tables`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/inventory`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/reservations?status=CHECKED_IN`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/pos/served-orders`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/taxes`, { credentials: 'include' }).then(res => res.json()),
      fetch(`${API_URL}/api/v1/guests`, { credentials: 'include' }).then(res => res.json())
    ]).then(([cats, items, tbls, invs, resvs, served, txs, gsts]) => {
      setCategories(cats.data || cats);
      setMenuItems(items.data || items);
      setTables(tbls.data || tbls);
      setTaxes(Array.isArray(txs.data) ? txs.data : (Array.isArray(txs) ? txs : []));
      
      const invData = invs.data || invs;
      setInventoryItems(Array.isArray(invData) ? invData : []);

      const resData = resvs.data || resvs;
      setInHouseGuests(Array.isArray(resData) ? resData : []);

      const servedData = served.data || served;
      setServedOrders(Array.isArray(servedData) ? servedData : []);

      const gstsData = gsts.data || gsts;
      setGuests(Array.isArray(gstsData) ? gstsData : []);
    }).catch(err => {
      console.error(err);
      showToast('Failed to load POS data', 'error', 'Error');
    });
  };

  const addToCart = (item: PosMenuItem) => {
    if (orderDestinationType === 'TABLE' && !selectedTable) {
      showToast('Please select a table first', 'error', 'Warning');
      return;
    }
    if (orderDestinationType === 'ROOM' && !selectedFolioId) {
      showToast('Please select an in-house guest first', 'error', 'Warning');
      return;
    }
    if (orderDestinationType === 'GUEST' && !selectedGuestId) {
      showToast('Please select a walk-in guest first', 'error', 'Warning');
      return;
    }
    setCart(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const increaseQuantity = (itemId: string) => {
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, quantity: c.quantity + 1 } : c));
  };

  const decreaseQuantity = (itemId: string) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === itemId) {
        return c.quantity > 1 ? { ...c, quantity: c.quantity - 1 } : c;
      }
      return c;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(p => p.item.id !== itemId));
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/v1/pos/tables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newTable) });
      showToast('Table added successfully', 'success', 'Success');
      setShowAddTable(false); setNewTable({ number: '', capacity: 2 });
      fetchData();
    } catch (err) { showToast('Failed to add table', 'error', 'Error'); }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/pos/tables/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        showToast('Table deleted successfully', 'success', 'Success');
        if (selectedTable === id) setSelectedTable(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to delete table', 'error', 'Error');
      }
    } catch (err) {
      showToast('Failed to delete table', 'error', 'Error');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editCategoryId ? 'PATCH' : 'POST';
      const url = editCategoryId ? `${API_URL}/api/v1/pos/categories/${editCategoryId}` : `${API_URL}/api/v1/pos/categories`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newCategory) });
      if (!res.ok) throw new Error('Failed to save category');
      showToast(`Category ${editCategoryId ? 'updated' : 'added'}`, 'success', 'Success');
      setShowAddCategory(false); setNewCategory({ name: '' }); setEditCategoryId(null);
      fetchData();
    } catch (err) { showToast('Failed to save category', 'error', 'Error'); }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/pos/categories/${categoryToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        showToast('Category deleted', 'success', 'Success');
        if (activeCategory === categoryToDelete.id) setActiveCategory('ALL');
        setCategoryToDelete(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete category');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error', 'Error');
    }
  };

  const handleEditCategory = (cat: PosCategory) => {
    setEditCategoryId(cat.id);
    setNewCategory({ name: cat.name });
    setShowAddCategory(true);
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItem.categoryId) { showToast('Please select a category', 'error', 'Error'); return; }
    try {
      const method = editMenuItemId ? 'PATCH' : 'POST';
      const url = editMenuItemId ? `${API_URL}/api/v1/pos/menu-items/${editMenuItemId}` : `${API_URL}/api/v1/pos/menu-items`;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(newMenuItem) });
      if (!res.ok) throw new Error('Failed to save menu item');
      showToast(`Menu Item ${editMenuItemId ? 'updated' : 'added'}`, 'success', 'Success');
      setShowAddMenuItem(false); setNewMenuItem({ name: '', price: 0, categoryId: '', type: 'FOOD', inventoryItemId: '', image: '', taxIds: [] }); setEditMenuItemId(null);
      fetchData();
    } catch (err) { showToast('Failed to save menu item', 'error', 'Error'); }
  };

  const handleDeleteMenuItem = async () => {
    if (!menuItemToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/pos/menu-items/${menuItemToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        showToast('Menu Item deleted', 'success', 'Success');
        setMenuItemToDelete(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete menu item');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete menu item', 'error', 'Error');
    }
  };

  const handleEditMenuItem = (item: PosMenuItem) => {
    setEditMenuItemId(item.id);
    setNewMenuItem({
      name: item.name,
      price: Number(item.price),
      categoryId: item.categoryId,
      type: item.type,
      inventoryItemId: item.recipes?.[0]?.inventoryItemId || '',
      image: item.image || '',
      taxIds: (item as any).taxes?.map((t: any) => t.id) || []
    });
    setShowAddMenuItem(true);
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      const payload: any = {};
      if (orderDestinationType === 'TABLE') payload.tableId = selectedTable;
      if (orderDestinationType === 'ROOM') payload.folioId = selectedFolioId;
      if (orderDestinationType === 'GUEST') payload.guestId = selectedGuestId;
      payload.notes = `[${orderDestinationDept}] ${orderNotes}`.trim();

      const orderRes = await fetch(`${API_URL}/api/v1/pos/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      }).then(res => res.json());

      const orderId = (orderRes.data || orderRes).id;

      await Promise.all(cart.map(c => 
        fetch(`${API_URL}/api/v1/pos/orders/${orderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ menuItemId: c.item.id, quantity: c.quantity })
        })
      ));

      showToast('Order sent to Kitchen/Bar successfully!', 'success', 'Order Placed');
      setCart([]);
      setSelectedTable(null);
      setSelectedFolioId(null);
      setOrderNotes('');
      setShowOrderNotes(false);
    } catch (err) {
      showToast('Failed to submit order', 'error', 'Error');
    }
  };

  const handleAddPayment = () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    setPayments([...payments, { method: paymentMethod, amount: Number(paymentAmount) }]);
    setPaymentAmount('');
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleOrder) return;

    try {
      const payload: any = {};
      if (settleOrder.folio?.reservation?.room || settleFolioId) {
        // Bill to room
        payload.folioId = settleFolioId || undefined; // Backend auto-uses existing folioId if set
      } else {
        // Walk-in payment - send all payments
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid < Number(settleOrder.totalAmount)) {
          showToast('Total payment must equal or exceed order total', 'error', 'Error');
          return;
        }
        payload.payments = payments;
      }
      
      const settleDiscountAmount = Number(settleOrder.totalAmount) * (settleDiscountPercent / 100);
      if (settleDiscountAmount > 0) payload.discountAmount = settleDiscountAmount;

      const res = await fetch(`${API_URL}/api/v1/pos/orders/${settleOrder.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Order settled successfully', 'success', 'Success');
        setShowSettleModal(false);
        setSettleOrder(null);
        setPayments([]);
        setSettleDiscountPercent(0);
        fetchData(); // Refresh served orders
        
        // Auto print receipt
        window.print();
      } else {
        showToast('Failed to settle order', 'error', 'Error');
      }
    } catch (err) {
      showToast('Failed to settle order', 'error', 'Error');
    }
  };

  const filteredItems = activeCategory === 'ALL' ? menuItems : menuItems.filter(item => item.categoryId === activeCategory);
  const cartTotal = cart.reduce((sum, c) => sum + (Number(c.item.price) * c.quantity), 0);
  let cartTaxes = 0;
  cart.forEach(c => {
    const itemTotal = Number(c.item.price) * c.quantity;
    let totalPercentage = 0;
    let totalFlat = 0;
    if ((c.item as any).taxes) {
      (c.item as any).taxes.forEach((tax: any) => {
        if (tax.isActive) {
          if (tax.type === 'PERCENTAGE') totalPercentage += Number(tax.rate);
          else if (tax.type === 'FLAT_AMOUNT') totalFlat += Number(tax.rate) * c.quantity;
        }
      });
    }
    const itemBeforeTax = (itemTotal - totalFlat) / (1 + totalPercentage / 100);
    cartTaxes += (itemTotal - itemBeforeTax);
  });
  const cartSubtotal = cartTotal - cartTaxes;

  const linkedInventoryIds = new Set(menuItems.flatMap(m => m.recipes?.map(r => r.inventoryItemId) || []));
  const availableInventoryItems = inventoryItems.filter(inv => inv.category !== 'HOUSEKEEPING' && inv.category !== 'MAINTENANCE' && !linkedInventoryIds.has(inv.id));


  const handleCreateGuest = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newGuest)
      });
      if (res.ok) {
        showToast('Guest created successfully', 'success', 'Success');
        setShowCreateGuest(false);
        setNewGuest({ firstName: '', lastName: '', companyName: '', address: '', phone: '', email: '', nationality: '' });
        fetchData(); // refresh guests
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to create guest', 'error', 'Error');
      }
    } catch (err) {
      showToast('Error creating guest', 'error', 'Error');
    }
  };
  return (
    <div className="pos-layout">
      {/* LEFT: Menu & Tables */}
      <div className="pos-main">
        {/* Destination Selector */}
        <div className="table-selector">
          <div className="section-header">
            <div className="flex gap-2">
              <button className={`btn-secondary ${orderDestinationType === 'TABLE' ? 'active-dest' : ''}`} onClick={() => setOrderDestinationType('TABLE')}>Walk-in / Table</button>
              <button className={`btn-secondary ${orderDestinationType === 'ROOM' ? 'active-dest' : ''}`} onClick={() => setOrderDestinationType('ROOM')}>In-House Guest</button>
              <button className={`btn-secondary ${orderDestinationType === 'GUEST' ? 'active-dest' : ''}`} onClick={() => setOrderDestinationType('GUEST')}>Walk-in Guest</button>
              {orderDestinationType === 'GUEST' && (
                <button className="btn-primary btn-sm" onClick={() => setShowCreateGuest(true)}>+ Create Guest</button>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn-success btn-sm" onClick={() => {fetchData(); setShowSettleModal(true);}}>Settle Orders ({servedOrders.length})</button>
              {canEditPos && <button className="btn-secondary btn-sm" onClick={() => setShowAddTable(true)}>+ Add Table</button>}
            </div>
          </div>
          
          {orderDestinationType === 'TABLE' ? (
            <div className="table-grid">
              {tables.map(table => (
                <div key={table.id} className="table-btn-wrapper">
                  <button 
                    className={`table-btn ${selectedTable === table.id ? 'active' : ''}`} 
                    onClick={() => setSelectedTable(table.id)}
                  >
                    Table {table.number}
                  </button>
                  {canEditPos && (
                    <button 
                      className="table-btn-delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                      title="Delete Table"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : orderDestinationType === 'ROOM' ? (
            <div className="room-selector">
              <select className="form-select w-full" value={selectedFolioId || ''} onChange={e => setSelectedFolioId(e.target.value)}>
                <option value="" disabled>Select a Checked-In Guest</option>
                {inHouseGuests.map(r => (
                  <option key={r.id} value={r.folio.id}>Room {r.room?.number || 'N/A'} - {r.guest.firstName} {r.guest.lastName}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="room-selector">
              <select className="form-select w-full" value={selectedGuestId || ''} onChange={e => setSelectedGuestId(e.target.value)}>
                <option value="" disabled>Select a Walk-in Guest</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.firstName} {g.lastName} {g.companyName ? `(${g.companyName})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="section-header mt-4">
          <h3>Menu</h3>
          <div className="flex gap-2">
            {canEditPos && <button className="btn-secondary btn-sm" onClick={() => setShowAddCategory(true)}>+ Category</button>}
            {canEditPos && <button className="btn-secondary btn-sm" onClick={() => setShowAddMenuItem(true)}>+ Menu Item</button>}
          </div>
        </div>
        <div className="category-scroll">
          <button className={`cat-btn ${activeCategory === 'ALL' ? 'active' : ''}`} onClick={() => setActiveCategory('ALL')}>All Items</button>
          {categories.map(cat => (
            <div key={cat.id} className="cat-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'hsl(220, 30%, 12%)', borderRadius: '20px', paddingRight: '12px' }}>
              <button className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`} style={{ border: 'none', background: 'transparent' }} onClick={() => setActiveCategory(cat.id)}>{cat.name}</button>
              {canEditPos && <button onClick={() => handleEditCategory(cat)} style={{ color: 'hsl(215, 20%, 65%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '1.1rem' }} title="Edit Category">✎</button>}
              {canEditPos && <button onClick={() => setCategoryToDelete(cat)} style={{ color: 'hsl(0, 84%, 60%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '1.4rem', lineHeight: 1 }} title="Delete Category">×</button>}
            </div>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="menu-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-card" onClick={() => addToCart(item)}>
              <div className="menu-card-actions" style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                {canEditPos && <button onClick={(e) => { e.stopPropagation(); handleEditMenuItem(item); }} style={{ background: 'hsl(220, 30%, 20%)', color: 'hsl(215, 20%, 80%)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Item">✎</button>}
                {canEditPos && <button onClick={(e) => { e.stopPropagation(); setMenuItemToDelete(item); }} style={{ background: 'hsl(0, 84%, 30%)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', lineHeight: 1 }} title="Delete Item">×</button>}
              </div>
              {item.image && <div className="menu-card-image" style={{ backgroundImage: `url(${item.image})` }}></div>}
              <div className="menu-card-content">
                <div className="menu-card-type">{item.type}</div>
                <h4>{item.name}</h4>
                <div className="menu-card-price">${Number(item.price).toFixed(2)}</div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && <div className="no-items">No items found.</div>}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="pos-cart">
        <h3>Current Order</h3>
        {orderDestinationType === 'TABLE' && (
          selectedTable ? <p className="cart-table">Table {tables.find(t => t.id === selectedTable)?.number}</p> : <p className="cart-table warning">No table selected</p>
        )}
        {orderDestinationType === 'ROOM' && (
          selectedFolioId ? <p className="cart-table text-success">Billed to Room</p> : <p className="cart-table warning">No guest selected</p>
        )}
        
        <div className="cart-items">
          {cart.length === 0 && <div className="empty-cart">Cart is empty</div>}
          {cart.map(c => (
            <div key={c.item.id} className="cart-item">
              <div className="ci-info">
                <span className="ci-name">{c.item.name}</span>
                <span className="ci-price">${Number(c.item.price).toFixed(2)}</span>
              </div>
              <div className="ci-actions">
                <span className="ci-total" style={{ marginRight: '8px' }}>${(Number(c.item.price) * c.quantity).toFixed(2)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'hsl(217, 20%, 15%)', padding: '4px', borderRadius: '8px' }}>
                  <button onClick={() => decreaseQuantity(c.item.id)} style={{ background: 'hsl(215, 20%, 30%)', border: 'none', color: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{c.quantity}</span>
                  <button onClick={() => increaseQuantity(c.item.id)} style={{ background: 'hsl(215, 20%, 30%)', border: 'none', color: 'white', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <button className="ci-remove" style={{ marginLeft: '8px', fontSize: '1.25rem' }} onClick={() => removeFromCart(c.item.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-footer">
          <div className="cart-summary" style={{ fontSize: '0.875rem', color: 'hsl(215, 20%, 65%)', marginBottom: '4px' }}>
            <span>Subtotal:</span>
            <span>${cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="cart-summary" style={{ fontSize: '0.875rem', color: 'hsl(215, 20%, 65%)', marginBottom: '4px' }}>
            <span>GST:</span>
            <span>${cartTaxes.toFixed(2)}</span>
          </div>
          <div className="cart-summary" style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '12px', borderTop: '1px solid hsl(217, 20%, 18%)', paddingTop: '8px' }}>
            <span>Total:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <button 
              className="btn-secondary w-full flex items-center justify-center gap-2" 
              onClick={() => setShowOrderNotes(!showOrderNotes)}
              style={{ background: 'hsl(222, 35%, 15%)', border: '1px solid hsl(217, 20%, 25%)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              {orderNotes ? 'Edit Special Request' : 'Add Special Request'}
            </button>
            {showOrderNotes && (
              <div style={{ marginTop: '8px', background: 'hsl(220, 30%, 12%)', border: '1px solid hsl(217, 20%, 25%)', borderRadius: '4px', padding: '8px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="dept" checked={orderDestinationDept === 'KITCHEN'} onChange={() => setOrderDestinationDept('KITCHEN')} /> Kitchen
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="dept" checked={orderDestinationDept === 'BAR'} onChange={() => setOrderDestinationDept('BAR')} /> Bar
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="dept" checked={orderDestinationDept === 'BOTH'} onChange={() => setOrderDestinationDept('BOTH')} /> Both
                  </label>
                </div>
                <textarea 
                  className="form-control" 
                  style={{ background: 'transparent', color: 'white', border: 'none', width: '100%', minHeight: '60px', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                  placeholder="Enter special requests for the entire order..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button 
                    className="btn-success btn-sm"
                    onClick={() => setShowOrderNotes(false)}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="btn-primary w-full mt-4" disabled={cart.length === 0 || (orderDestinationType === 'TABLE' && !selectedTable) || (orderDestinationType === 'ROOM' && !selectedFolioId) || (orderDestinationType === 'GUEST' && !selectedGuestId)} onClick={submitOrder}>
            Send to Kitchen/Bar
          </button>
        </div>
      </div>

      {/* SETTLE MODAL */}
      {showSettleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3>Settle Served Orders</h3>
            {!settleOrder ? (
              <div className="served-list">
                {servedOrders.length === 0 && <p className="text-muted">No served orders waiting for settlement.</p>}
                {servedOrders.map(so => (
                  <div key={so.id} className="served-card" onClick={() => { setSettleOrder(so); setPaymentAmount(String(so.totalAmount)); }}>
                    <div className="sc-header">
                      <span>Order #{so.id.substring(0,8).toUpperCase()}</span>
                      <span className="sc-total">${Number(so.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="sc-body">
                      {so.folio?.reservation?.room ? `Room ${so.folio.reservation.room.number} - ${so.folio.reservation.guest.firstName} ${so.folio.reservation.guest.lastName}` : so.table ? `Table ${so.table.number}` : 'Walk-in'}
                      <div style={{ fontSize: '0.8rem', color: 'hsl(215, 20%, 65%)', marginTop: '4px' }}>
                        Staff: {so.user ? `${so.user.firstName} ${so.user.lastName}` : 'Unknown'}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowSettleModal(false)}>Close</button>
                </div>
              </div>
            ) : (
              <div className="settle-form">
                <div className="sc-header" style={{ marginBottom: '16px' }}>
                  <span>Order #{settleOrder.id.substring(0,8).toUpperCase()}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {canSeeDiscount && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'hsl(215, 20%, 65%)' }}>Discount (%):</span>
                        <input 
                          type="number" 
                          step="1"
                          max="100"
                          value={settleDiscountPercent || ''} 
                          onChange={e => setSettleDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))} 
                          style={{ width: '60px', background: 'hsl(222, 35%, 15%)', border: '1px solid hsl(217, 20%, 25%)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'right' }} 
                          placeholder="0"
                        />
                      </div>
                    )}
                    <span className="sc-total">${Math.max(0, Number(settleOrder.totalAmount) - (Number(settleOrder.totalAmount) * (settleDiscountPercent / 100))).toFixed(2)}</span>
                  </div>
                </div>
                {settleOrder.folio?.reservation?.room ? (
                  <div className="p-4" style={{ background: 'hsl(222, 35%, 15%)', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ color: 'white', fontWeight: 600 }}>Guest: {settleOrder.folio.reservation.guest.firstName} {settleOrder.folio.reservation.guest.lastName} (Room {settleOrder.folio.reservation.room.number})</p>
                    <p style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.9rem', marginTop: '4px' }}>This order will be charged directly to the guest's folio.</p>
                  </div>
                ) : (
                  <div className="walk-in-payment">
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label>Optional: Bill to Checked-In Guest</label>
                      <select className="form-select w-full" value={settleFolioId || ''} onChange={e => setSettleFolioId(e.target.value)}>
                        <option value="">-- Do not bill to room (Pay now) --</option>
                        {inHouseGuests.map(r => (
                          <option key={r.id} value={r.folio.id}>Room {r.room?.number || 'N/A'} - {r.guest.firstName} {r.guest.lastName}</option>
                        ))}
                      </select>
                    </div>

                    {!settleFolioId && payments.length > 0 && (
                      <div className="payments-list" style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: 'white', fontSize: '0.875rem', marginBottom: '8px' }}>Payments Added</h4>
                        {payments.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'hsl(222, 35%, 15%)', borderRadius: '4px', marginBottom: '4px' }}>
                            <span style={{ color: 'hsl(215, 20%, 65%)' }}>{p.method.replace('PAYMENT_', '')}</span>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ color: 'white', fontWeight: 600 }}>${p.amount.toFixed(2)}</span>
                              <button type="button" onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', color: 'hsl(0, 84%, 60%)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(217, 20%, 25%)' }}>
                          <span style={{ color: 'white', fontWeight: 600 }}>Remaining Balance:</span>
                          <span style={{ color: 'hsl(43,96%,56%)', fontWeight: 700 }}>
                            ${Math.max(0, (Number(settleOrder.totalAmount) - (Number(settleOrder.totalAmount) * (settleDiscountPercent / 100))) - payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {!settleFolioId && payments.reduce((sum, p) => sum + p.amount, 0) < Number(settleOrder.totalAmount) && (
                      <div className="payment-entry-form" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px' }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label>Amount ($)</label>
                          <input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={Math.max(0, (Number(settleOrder.totalAmount) - (Number(settleOrder.totalAmount) * (settleDiscountPercent / 100))) - payments.reduce((sum, p) => sum + p.amount, 0))} />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label>Method</label>
                          <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="PAYMENT_CASH">Cash</option>
                            <option value="PAYMENT_CARD">Credit Card</option>
                            <option value="PAYMENT_MOBILE">Mobile Money</option>
                            <option value="PAYMENT_BANK">Bank Transfer</option>
                          </select>
                        </div>
                        <button type="button" className="btn-secondary" onClick={handleAddPayment}>Add</button>
                      </div>
                    )}
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => { setSettleOrder(null); setPayments([]); setSettleDiscountPercent(0); }}>Back</button>
                  <button type="button" className="btn-success" onClick={handleSettle} disabled={(!settleOrder.folio?.reservation?.room && !settleOrder.folioId) && payments.reduce((sum, p) => sum + p.amount, 0) < Math.max(0, Number(settleOrder.totalAmount) - (Number(settleOrder.totalAmount) * (settleDiscountPercent / 100)))}>
                    {(settleOrder.folio?.reservation?.room || settleOrder.folioId) ? 'Charge to Folio' : 'Complete Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modals Omitted For Brevity (Re-added below) */}
      {showAddTable && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Table</h3>
            <form onSubmit={handleAddTable}>
              <div className="form-group"><label>Table Number</label><input required type="text" value={newTable.number} onChange={e => setNewTable({...newTable, number: e.target.value})} /></div>
              <div className="form-group"><label>Capacity</label><input required type="number" min="1" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: Number(e.target.value)})} /></div>
              <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => setShowAddTable(false)}>Cancel</button><button type="submit" className="btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editCategoryId ? 'Edit' : 'Add'} Category</h3>
            <form onSubmit={handleAddCategory}>
              <div className="form-group"><label>Name</label><input required type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => { setShowAddCategory(false); setEditCategoryId(null); setNewCategory({name: ''}); }}>Cancel</button><button type="submit" className="btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Category</h3>
            <p style={{ color: 'hsl(215, 20%, 65%)', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{categoryToDelete.name}</strong>? 
              <br/><br/>
              <span style={{ color: 'hsl(0, 84%, 65%)' }}>All menu items within this category will also be deleted! This action cannot be undone.</span>
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setCategoryToDelete(null)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ background: 'hsl(0, 84%, 60%)', color: 'white' }} onClick={handleDeleteCategory}>Delete Category</button>
            </div>
          </div>
        </div>
      )}

      {showAddMenuItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editMenuItemId ? 'Edit' : 'Add'} Menu Item</h3>
            <form onSubmit={handleAddMenuItem}>
              <div className="form-group"><label>Name</label><input required type="text" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} /></div>
              <div className="form-group"><label>Price ($)</label><input required type="number" min="0" step="0.01" value={newMenuItem.price} onChange={e => setNewMenuItem({...newMenuItem, price: Number(e.target.value)})} /></div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-select" required value={newMenuItem.categoryId} onChange={e => setNewMenuItem({...newMenuItem, categoryId: e.target.value})}>
                  <option value="" disabled>Select...</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="form-select" value={newMenuItem.type} onChange={e => setNewMenuItem({...newMenuItem, type: e.target.value})}>
                  <option value="FOOD">Food</option>
                  <option value="DRINK">Drink</option>
                </select>
              </div>
              <div className="form-group">
                <label>Inventory Link (Optional)</label>
                <select className="form-select" value={newMenuItem.inventoryItemId} onChange={e => setNewMenuItem({...newMenuItem, inventoryItemId: e.target.value})}>
                  <option value="">-- None --</option>
                  {availableInventoryItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Taxes</label>
                <select className="form-select" multiple style={{ height: '80px' }} value={newMenuItem.taxIds} onChange={e => {
                  const options = e.target.options;
                  const selected = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) selected.push(options[i].value);
                  }
                  setNewMenuItem({...newMenuItem, taxIds: selected});
                }}>
                  {taxes.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name} ({t.type === 'PERCENTAGE' ? `${t.rate}%` : `$${t.rate}`})</option>)}
                </select>
                <small style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.75rem' }}>Hold Ctrl/Cmd to select multiple</small>
              </div>
              <div className="modal-actions"><button type="button" className="btn-cancel" onClick={() => { setShowAddMenuItem(false); setEditMenuItemId(null); setNewMenuItem({ name: '', price: 0, categoryId: '', type: 'FOOD', inventoryItemId: '', image: '', taxIds: [] }); }}>Cancel</button><button type="submit" className="btn-primary">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {menuItemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Menu Item</h3>
            <p style={{ color: 'hsl(215, 20%, 65%)', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{menuItemToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setMenuItemToDelete(null)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ background: 'hsl(0, 84%, 60%)', color: 'white' }} onClick={handleDeleteMenuItem}>Delete Item</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pos-layout { display: flex; gap: 24px; height: calc(100vh - 120px); }
        .pos-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .pos-cart { width: 380px; background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 16%); border-radius: 12px; display: flex; flex-direction: column; padding: 20px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .section-header h3 { margin: 0; }
        .table-selector h3, .pos-cart h3 { margin: 0; color: hsl(210, 40%, 96%); font-size: 1.125rem; }
        .pos-cart h3 { margin-bottom: 16px; }
        .flex { display: flex; }
        .gap-2 { gap: 8px; }
        .mt-4 { margin-top: 16px; }
        .p-4 { padding: 16px; }

        .btn-secondary { background: transparent; border: 1px solid hsl(43,96%,56%,0.4); color: hsl(43,96%,60%); border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .btn-secondary:hover { background: hsl(43,96%,56%,0.1); }
        .btn-secondary.active-dest { background: hsl(43,96%,56%); color: hsl(224,39%,6%); }
        .btn-success { background: hsl(142, 76%, 36%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; padding: 6px 12px; transition: background 0.2s; }
        .btn-success:hover { background: hsl(142, 76%, 30%); }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; }

        .table-grid { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
        .table-btn-wrapper { position: relative; flex-shrink: 0; }
        .table-btn { width: 100%; padding: 12px 32px 12px 24px; background: hsl(220, 30%, 12%); border: 1px solid hsl(217, 20%, 20%); border-radius: 8px; color: hsl(210, 40%, 96%); font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .table-btn:hover { background: hsl(217, 20%, 16%); }
        .table-btn.active { background: hsl(43,96%,56%, 0.1); border-color: hsl(43,96%,56%); color: hsl(43,96%,60%); }
        .table-btn-delete { position: absolute; top: 4px; right: 4px; background: transparent; border: none; color: hsl(0, 84%, 60%); font-size: 1.25rem; line-height: 1; cursor: pointer; padding: 0 4px; border-radius: 4px; opacity: 0.7; transition: all 0.2s; }
        .table-btn-delete:hover { opacity: 1; background: hsl(0, 84%, 60%, 0.15); }
        .room-selector select { background: hsl(220, 30%, 12%); border: 1px solid hsl(217, 20%, 20%); color: white; padding: 12px; border-radius: 8px; outline: none; }
        
        .category-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
        .cat-btn { white-space: nowrap; padding: 8px 16px; background: hsl(220, 30%, 12%); border: 1px solid transparent; border-radius: 20px; color: hsl(215, 20%, 65%); cursor: pointer; font-weight: 500; }
        .cat-btn.active { background: hsl(220, 40%, 20%); color: white; }
        .menu-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); grid-auto-rows: max-content; align-content: start; gap: 16px; overflow-y: auto; padding-right: 8px; }
        .menu-card { background: hsl(220, 30%, 12%); border: 1px solid hsl(217, 20%, 16%); border-radius: 12px; cursor: pointer; transition: transform 0.1s, border-color 0.2s; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .menu-card:hover { transform: translateY(-2px); border-color: hsl(215, 20%, 30%); }
        .menu-card-image { height: 120px; width: 100%; background-size: cover; background-position: center; border-bottom: 1px solid hsl(217, 20%, 16%); }
        .menu-card-content { padding: 16px; display: flex; flex-direction: column; }
        .menu-card-type { font-size: 0.65rem; text-transform: uppercase; color: hsl(215, 20%, 50%); margin-bottom: 8px; }
        .menu-card h4 { margin: 0 0 12px 0; color: hsl(210, 40%, 96%); font-size: 1rem; }
        .menu-card-price { font-weight: 700; color: hsl(43,96%,56%); }
        .cart-table { color: hsl(215, 20%, 65%); margin: 0 0 16px 0; font-size: 0.875rem; }
        .cart-table.warning { color: hsl(0, 84%, 60%); }
        .text-success { color: hsl(142, 76%, 45%); }
        .text-muted { color: hsl(215, 20%, 50%); }
        .cart-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .empty-cart { color: hsl(215, 20%, 50%); text-align: center; padding: 40px 0; }
        .cart-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px dashed hsl(217, 20%, 16%); }
        .ci-info { display: flex; flex-direction: column; gap: 4px; }
        .ci-name { color: white; font-weight: 500; font-size: 0.9rem; }
        .ci-price { color: hsl(215, 20%, 50%); font-size: 0.8rem; }
        .ci-actions { display: flex; align-items: center; gap: 12px; }
        .ci-total { color: white; font-weight: 600; font-size: 0.95rem; }
        .ci-remove { background: none; border: none; color: hsl(0, 84%, 60%); font-size: 1.5rem; line-height: 1; cursor: pointer; }
        .cart-footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid hsl(217, 20%, 16%); }
        .cart-summary { display: flex; justify-content: space-between; color: white; font-size: 1.125rem; font-weight: 700; }
        .btn-primary { background: hsl(43,96%,56%); color: hsl(224, 39%, 6%); border: none; border-radius: 6px; padding: 12px; font-weight: 600; cursor: pointer; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .w-full { width: 100%; }

        /* Modal specific */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-content { background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 16%); border-radius: 12px; padding: 24px; width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto; }
        .modal-content h3 { margin: 0 0 24px 0; color: white; }
        .form-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
        .form-group label { color: hsl(215, 20%, 65%); font-size: 0.875rem; }
        .form-group input, .form-select { background: hsl(220, 30%, 8%); border: 1px solid hsl(217, 20%, 20%); color: white; padding: 10px 12px; border-radius: 6px; outline: none; font-family: inherit; }
        .form-group input:focus, .form-select:focus { border-color: hsl(43,96%,56%); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .btn-cancel { background: transparent; color: hsl(215, 20%, 65%); border: 1px solid hsl(217, 20%, 30%); padding: 10px 20px; border-radius: 6px; font-weight: 500; cursor: pointer; }

        /* Settle Orders Specific */
        .served-list { display: flex; flex-direction: column; gap: 12px; }
        .served-card { background: hsl(220, 30%, 12%); border: 1px solid hsl(217, 20%, 20%); border-radius: 8px; padding: 16px; cursor: pointer; transition: background 0.2s; }
        .served-card:hover { background: hsl(217, 20%, 20%); }
        .sc-header { display: flex; justify-content: space-between; color: white; font-weight: 600; font-size: 1.1rem; margin-bottom: 8px; }
        .sc-total { color: hsl(43,96%,56%); }
        .sc-body { color: hsl(215, 20%, 65%); font-size: 0.9rem; }
        
        /* Mobile & Tablet Overrides */
        @media (max-width: 1024px) {
          .pos-layout {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
          }
          .pos-cart {
            width: 100%;
            height: auto;
            max-height: none;
            order: -1; /* Put cart at the top on mobile so they can see order total easily */
            margin-bottom: 16px;
          }
          .pos-main {
            overflow: visible;
          }
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .section-header .flex {
            width: 100%;
            flex-wrap: wrap;
          }
        }
      `}</style>

        {showCreateGuest && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <h3>Create Walk-in Guest</h3>
              <div className="form-group">
                <label>First Name*</label>
                <input type="text" value={newGuest.firstName} onChange={e => setNewGuest({...newGuest, firstName: e.target.value})} className="input-field" required />
              </div>
              <div className="form-group">
                <label>Last Name*</label>
                <input type="text" value={newGuest.lastName} onChange={e => setNewGuest({...newGuest, lastName: e.target.value})} className="input-field" required />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" value={newGuest.companyName} onChange={e => setNewGuest({...newGuest, companyName: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Contact (Phone)</label>
                <input type="text" value={newGuest.phone} onChange={e => setNewGuest({...newGuest, phone: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newGuest.email} onChange={e => setNewGuest({...newGuest, email: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={newGuest.address} onChange={e => setNewGuest({...newGuest, address: e.target.value})} className="input-field" />
              </div>
              <div className="form-group">
                <label>Nationality</label>
                <input type="text" value={newGuest.nationality} onChange={e => setNewGuest({...newGuest, nationality: e.target.value})} className="input-field" />
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowCreateGuest(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleCreateGuest} disabled={!newGuest.firstName || !newGuest.lastName}>Create</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

