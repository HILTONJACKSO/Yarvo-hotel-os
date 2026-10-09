'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Property = {
  id: string;
  name: string;
  legalName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
};

type RoomType = {
  id: string;
  code: string;
  name: string;
  maxOccupancy: number;
  baseRateUsd: number;
  amenities: string[];
};

import ReceiptsSettings from '@/components/settings/ReceiptsSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'room-types' | 'taxes' | 'receipts'>('general');
  const { showToast } = useToast();

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h2>System Settings</h2>
          <p className="text-muted">Manage your hotel's configuration and preferences.</p>
        </div>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Settings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'room-types' ? 'active' : ''}`}
            onClick={() => setActiveTab('room-types')}
          >
            Room Types
          </button>
          <button 
            className={`tab-btn ${activeTab === 'taxes' ? 'active' : ''}`}
            onClick={() => setActiveTab('taxes')}
          >
            Taxes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => setActiveTab('receipts')}
          >
            Receipts & Invoices
          </button>
        </div>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && <GeneralSettings showToast={showToast} />}
        {activeTab === 'room-types' && <RoomTypesSettings showToast={showToast} />}
        {activeTab === 'taxes' && <TaxesSettings showToast={showToast} />}
        {activeTab === 'receipts' && <ReceiptsSettings showToast={showToast} />}
      </div>

      <style>{`
        .settings-container { display: flex; flex-direction: column; gap: 32px; padding: 8px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid hsl(217, 20%, 14%); padding-bottom: 16px; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; font-size: 1.5rem; margin-bottom: 8px; }
        .text-muted { margin: 0; color: hsl(215, 20%, 65%); font-size: 0.9375rem; }
        
        .tabs { display: flex; gap: 8px; background: hsl(222, 35%, 12%); padding: 4px; border-radius: 8px; border: 1px solid hsl(217, 20%, 18%); }
        .tab-btn { background: transparent; border: none; color: hsl(215, 20%, 65%); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9375rem; transition: all 0.2s; font-weight: 500; }
        .tab-btn:hover { color: hsl(210, 40%, 96%); }
        .tab-btn.active { background: hsl(217, 20%, 20%); color: hsl(210, 40%, 96%); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        
        .panel { background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); border-radius: 12px; padding: 24px; }
        .panel h3 { margin: 0 0 24px 0; color: hsl(210, 40%, 96%); font-size: 1.25rem; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { color: hsl(215, 20%, 65%); font-size: 0.875rem; font-weight: 500; }
        .form-input { background: hsl(222, 35%, 12%); border: 1px solid hsl(217, 20%, 18%); color: white; padding: 10px 12px; border-radius: 6px; font-size: 0.9375rem; }
        .form-input:focus { outline: none; border-color: hsl(210, 100%, 50%); }
        
        .btn-primary { background: hsl(210, 100%, 50%); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .btn-primary:hover { background: hsl(210, 100%, 45%); }
        .btn-secondary { background: hsl(217, 20%, 20%); color: white; border: 1px solid hsl(217, 20%, 30%); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
        
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px 16px; color: hsl(215, 20%, 65%); font-size: 0.875rem; font-weight: 500; border-bottom: 1px solid hsl(217, 20%, 18%); }
        .data-table td { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 14%); color: hsl(210, 40%, 96%); font-size: 0.9375rem; }
        .data-table tbody tr:hover { background: hsl(222, 35%, 12%); }
        
        .amenity-tag { display: inline-block; background: hsl(217, 20%, 20%); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-right: 4px; margin-bottom: 4px; color: hsl(215, 20%, 80%); }
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .header-actions h3 { margin: 0; }
      `}</style>
    </div>
  );
}

function GeneralSettings({ showToast }: { showToast: any }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/properties`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProperty(data.data || data))
      .catch(err => console.error(err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    
    // Create a payload with only the editable fields
    // This prevents validation errors for system fields like id, createdAt, etc.
    const payload = {
      name: property.name,
      legalName: property.legalName,
      address: property.address,
      city: property.city,
      country: property.country,
      phone: property.phone,
      email: property.email,
      website: property.website,
      taxId: property.taxId,
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (res.ok) {
        showToast('Settings saved successfully.', 'success', 'Saved');
      } else {
        const err = await res.json();
        showToast(`Failed to save: ${err.message}`, 'error', 'Error');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error', 'Error');
    }
    setSaving(false);
  };

  if (!property) return <div>Loading settings...</div>;

  return (
    <form className="panel" onSubmit={handleSave}>
      <h3>Property Details</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Hotel Name</label>
          <input className="form-input" value={property.name || ''} onChange={e => setProperty({...property, name: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Legal Entity Name</label>
          <input className="form-input" value={property.legalName || ''} onChange={e => setProperty({...property, legalName: e.target.value})} />
        </div>
        <div className="form-group full">
          <label>Address</label>
          <input className="form-input" value={property.address || ''} onChange={e => setProperty({...property, address: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>City</label>
          <input className="form-input" value={property.city || ''} onChange={e => setProperty({...property, city: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Country</label>
          <input className="form-input" value={property.country || ''} onChange={e => setProperty({...property, country: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input className="form-input" value={property.phone || ''} onChange={e => setProperty({...property, phone: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input className="form-input" type="email" value={property.email || ''} onChange={e => setProperty({...property, email: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Website</label>
          <input className="form-input" value={property.website || ''} onChange={e => setProperty({...property, website: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Tax ID (TIN)</label>
          <input className="form-input" value={property.taxId || ''} onChange={e => setProperty({...property, taxId: e.target.value})} />
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}

function RoomTypesSettings({ showToast }: { showToast: any }) {
  const [types, setTypes] = useState<RoomType[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [maxOccupancy, setMaxOccupancy] = useState(2);
  const [baseRateUsd, setBaseRateUsd] = useState(100);
  const [amenities, setAmenities] = useState('WiFi, TV, AC');
  const [taxIds, setTaxIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRoomTypes();
    fetchTaxes();
  }, []);

  const fetchRoomTypes = () => {
    fetch(`${API_URL}/api/v1/room-types`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTypes(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])))
      .catch(err => console.error(err));
  };
  
  const fetchTaxes = () => {
    fetch(`${API_URL}/api/v1/taxes`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTaxes(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])))
      .catch(err => console.error(err));
  };

  const handleOpenNew = () => {
    setEditingType(null);
    setCode('');
    setName('');
    setMaxOccupancy(2);
    setBaseRateUsd(100);
    setAmenities('WiFi, TV, AC');
    setTaxIds([]);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      name,
      maxOccupancy,
      baseRateUsd,
      amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
      taxIds
    };

    try {
      const url = editingType ? `${API_URL}/api/v1/room-types/${editingType.id}` : `${API_URL}/api/v1/room-types`;
      const method = editingType ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (res.ok) {
        showToast(editingType ? 'Room type updated successfully.' : 'Room type created successfully.', 'success', 'Success');
        setShowModal(false);
        fetchRoomTypes();
      } else {
        const err = await res.json();
        showToast(`Failed to save room type: ${err.message}`, 'error', 'Error');
      }
    } catch (err) {
      showToast('An error occurred.', 'error', 'Error');
    }
  };

  return (
    <div className="panel">
      <div className="header-actions">
        <h3>Room Types</h3>
        <button className="btn-primary" onClick={handleOpenNew}>
          + Add Room Type
        </button>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Capacity</th>
            <th>Base Rate (USD)</th>
            <th>Taxes</th>
            <th>Amenities</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {types.map(rt => (
            <tr key={rt.id}>
              <td>{rt.code}</td>
              <td>{rt.name}</td>
              <td>{rt.maxOccupancy} persons</td>
              <td>${Number(rt.baseRateUsd).toFixed(2)}</td>
              <td>
                {(rt as any).taxes && (rt as any).taxes.length > 0 ? (rt as any).taxes.map((t: any) => <span key={t.id} className="amenity-tag" style={{background: 'hsl(217, 30%, 30%)'}}>{t.name}</span>) : '-'}
              </td>
              <td>
                {rt.amenities.map(am => (
                  <span key={am} className="amenity-tag">{am}</span>
                ))}
              </td>
              <td>
                <button className="btn-secondary" onClick={() => {
                  setEditingType(rt);
                  setCode(rt.code);
                  setName(rt.name);
                  setMaxOccupancy(rt.maxOccupancy);
                  setBaseRateUsd(Number(rt.baseRateUsd));
                  setAmenities(rt.amenities.join(', '));
                  setTaxIds((rt as any).taxes ? (rt as any).taxes.map((t: any) => t.id) : []);
                  setShowModal(true);
                }}>Edit</button>
              </td>
            </tr>
          ))}
          {types.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: 'hsl(215, 20%, 65%)' }}>No room types found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingType ? 'Edit Room Type' : 'New Room Type'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code</label>
                  <input className="form-input" value={code} onChange={e => setCode(e.target.value)} required placeholder="e.g. DLX" />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Deluxe Room" />
                </div>
                <div className="form-group">
                  <label>Max Occupancy</label>
                  <input className="form-input" type="number" value={maxOccupancy} onChange={e => setMaxOccupancy(Number(e.target.value))} required min="1" />
                </div>
                <div className="form-group">
                  <label>Base Rate (USD)</label>
                  <input className="form-input" type="number" step="0.01" value={baseRateUsd} onChange={e => setBaseRateUsd(Number(e.target.value))} required min="0" />
                </div>
                <div className="form-group full">
                  <label>Amenities (Comma separated)</label>
                  <input className="form-input" value={amenities} onChange={e => setAmenities(e.target.value)} required placeholder="WiFi, AC, TV" />
                </div>
                <div className="form-group full">
                  <label>Applicable Taxes</label>
                  <select className="form-select" multiple style={{ height: '80px', background: 'hsl(222, 35%, 12%)', border: '1px solid hsl(217, 20%, 18%)', color: 'white', padding: '10px 12px', borderRadius: '6px' }} value={taxIds} onChange={e => {
                    const options = e.target.options;
                    const selected = [];
                    for (let i = 0; i < options.length; i++) {
                      if (options[i].selected) selected.push(options[i].value);
                    }
                    setTaxIds(selected);
                  }}>
                    {taxes.filter(t => t.isActive).map(t => <option key={t.id} value={t.id}>{t.name} ({t.type === 'PERCENTAGE' ? `${t.rate}%` : `$${t.rate}`})</option>)}
                  </select>
                  <small style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.75rem' }}>Hold Ctrl/Cmd to select multiple</small>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Room Type</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type Tax = {
  id: string;
  name: string;
  rate: number;
  type: string;
  isActive: boolean;
};

function TaxesSettings({ showToast }: { showToast: any }) {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [type, setType] = useState('PERCENTAGE');

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = () => {
    fetch(`${API_URL}/api/v1/taxes`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTaxes(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])))
      .catch(err => console.error(err));
  };

  const handleOpenNew = () => {
    setEditingTax(null);
    setName('');
    setRate('');
    setType('PERCENTAGE');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      rate: Number(rate),
      type
    };

    try {
      const url = editingTax ? `${API_URL}/api/v1/taxes/${editingTax.id}` : `${API_URL}/api/v1/taxes`;
      const method = editingTax ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (res.ok) {
        showToast(editingTax ? 'Tax updated successfully.' : 'Tax created successfully.', 'success', 'Success');
        setShowModal(false);
        fetchTaxes();
      } else {
        const err = await res.json();
        showToast(`Failed to save tax: ${err.message}`, 'error', 'Error');
      }
    } catch (err) {
      showToast('An error occurred.', 'error', 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax?')) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/taxes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showToast('Tax deleted.', 'success');
        fetchTaxes();
      } else {
        showToast('Failed to delete tax.', 'error');
      }
    } catch (err) {
      showToast('An error occurred.', 'error');
    }
  };

  return (
    <div className="panel">
      <div className="header-actions">
        <h3>Government Taxes</h3>
        <button className="btn-primary" onClick={handleOpenNew}>
          + Add Tax
        </button>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rate</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {taxes.map(tax => (
            <tr key={tax.id}>
              <td>{tax.name}</td>
              <td>{tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `$${tax.rate}`}</td>
              <td>{tax.type}</td>
              <td>
                <span className="amenity-tag" style={{ background: tax.isActive ? 'hsl(142, 60%, 20%)' : 'hsl(0, 60%, 20%)', color: tax.isActive ? 'hsl(142, 70%, 70%)' : 'hsl(0, 70%, 70%)' }}>
                  {tax.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => {
                  setEditingTax(tax);
                  setName(tax.name);
                  setRate(tax.rate.toString());
                  setType(tax.type);
                  setShowModal(true);
                }}>Edit</button>
                <button className="btn-secondary" style={{ borderColor: 'hsl(0, 60%, 30%)', color: 'hsl(0, 70%, 70%)' }} onClick={() => handleDelete(tax.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {taxes.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(215, 20%, 65%)' }}>No taxes found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTax ? 'Edit Tax' : 'New Tax'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Tax Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. VAT" />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Tax Type</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT_AMOUNT">Flat Amount ($)</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Rate/Amount</label>
                <input className="form-input" type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} required placeholder="e.g. 10.5" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Tax</button>
              </div>
            </form>
          </div>
          <style>{`
            .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; }
            .modal-content { background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); padding: 24px; border-radius: 12px; width: 400px; max-width: 90vw; }
            .modal-content h3 { margin-top: 0; margin-bottom: 24px; color: white; }
          `}</style>
        </div>
      )}
    </div>
  );
}

