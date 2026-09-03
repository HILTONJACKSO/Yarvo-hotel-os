'use client';

import { useState, useEffect } from 'react';
import { Building2, Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

type Company = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  balance: number;
  isActive: boolean;
};

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    isActive: true,
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/v1/companies');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSave = async () => {
    try {
      const url = selectedCompany 
        ? `/api/v1/companies/${selectedCompany.id}`
        : '/api/v1/companies';
        
      const res = await fetch(url, {
        method: selectedCompany ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCompanies();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to save company');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (company?: Company) => {
    if (company) {
      setSelectedCompany(company);
      setFormData({
        name: company.name,
        contactName: company.contactName || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        taxId: company.taxId || '',
        isActive: company.isActive,
      });
    } else {
      setSelectedCompany(null);
      setFormData({
        name: '', contactName: '', email: '', phone: '', address: '', taxId: '', isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.contactName && c.contactName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Corporate Accounts</h1>
          <p className="page-subtitle">Manage company profiles, billing, and outstanding balances.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="primary-btn" onClick={() => openModal()}>
            <Plus size={18} /> Add Company
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <Search size={18} color="hsl(215, 20%, 50%)" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-container">
        {loading ? (
          <div className="loading-state">Loading companies...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No companies found.</div>
        ) : (
          filtered.map(company => (
            <div key={company.id} className="company-card">
              <div className="company-header">
                <div className="company-title">
                  <Building2 size={20} className="text-primary" />
                  <h3>{company.name}</h3>
                  {!company.isActive && <span className="status-badge inactive">Inactive</span>}
                </div>
                <button className="icon-btn" onClick={() => openModal(company)}>
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="company-details">
                {company.contactName && (
                  <div className="detail-row">
                    <CheckCircle2 size={14} /> <span>{company.contactName}</span>
                  </div>
                )}
                {company.email && (
                  <div className="detail-row">
                    <Mail size={14} /> <span>{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="detail-row">
                    <Phone size={14} /> <span>{company.phone}</span>
                  </div>
                )}
                {company.address && (
                  <div className="detail-row">
                    <MapPin size={14} /> <span>{company.address}</span>
                  </div>
                )}
                {company.taxId && (
                  <div className="detail-row">
                    <FileText size={14} /> <span>Tax ID: {company.taxId}</span>
                  </div>
                )}
              </div>

              <div className="company-footer">
                <div className="balance-info">
                  <span className="balance-label">Outstanding Balance</span>
                  <span className={`balance-amount ${Number(company.balance) > 0 ? 'text-danger' : 'text-success'}`}>
                    ${Number(company.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedCompany ? 'Edit Company' : 'Add New Company'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body form-grid">
              <div className="form-group full-width">
                <label>Company Name *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact Name</label>
                <input 
                  type="text" 
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Tax ID / EIN</label>
                <input 
                  type="text" 
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="form-group full-width checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Company is Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSave} disabled={!formData.name}>
                {selectedCompany ? 'Save Changes' : 'Create Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .companies-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: hsl(222, 35%, 10%);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid hsl(217, 20%, 16%);
        }

        .page-title {
          font-size: 1.5rem;
          color: white;
          margin: 0 0 4px;
        }

        .page-subtitle {
          color: hsl(215, 20%, 65%);
          margin: 0;
          font-size: 0.875rem;
        }

        .primary-btn {
          background: hsl(43,96%,56%);
          color: hsl(222,47%,11%);
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .toolbar {
          display: flex;
          gap: 16px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          padding: 10px 16px;
          border-radius: 8px;
          flex: 1;
        }
        
        .search-bar input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          outline: none;
        }

        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .company-card {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }

        .company-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid hsl(217, 20%, 14%);
        }

        .company-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .company-title h3 {
          margin: 0;
          font-size: 1.125rem;
        }

        .text-primary {
          color: hsl(43,96%,56%);
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: hsl(215, 20%, 65%);
          cursor: pointer;
        }
        .icon-btn:hover {
          color: white;
        }

        .status-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          background: hsl(0, 84%, 60%, 0.2);
          color: hsl(0, 84%, 65%);
        }

        .company-details {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: hsl(215, 20%, 65%);
          font-size: 0.875rem;
        }

        .company-footer {
          padding: 16px 20px;
          background: hsl(220, 30%, 8%);
          border-top: 1px solid hsl(217, 20%, 14%);
          border-radius: 0 0 12px 12px;
        }

        .balance-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .balance-label {
          color: hsl(215, 20%, 65%);
          font-size: 0.875rem;
        }

        .balance-amount {
          font-weight: 700;
          font-size: 1.125rem;
        }

        .text-danger { color: hsl(0, 84%, 65%); }
        .text-success { color: hsl(142, 76%, 50%); }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid hsl(217, 20%, 14%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          color: white;
          font-size: 1.25rem;
        }

        .close-btn {
          background: none; border: none;
          color: hsl(215, 20%, 65%);
          font-size: 1.5rem;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          display: block;
          color: hsl(215, 20%, 65%);
          font-size: 0.875rem;
          margin-bottom: 8px;
        }

        .form-group input[type="text"],
        .form-group input[type="email"] {
          width: 100%;
          background: hsl(220, 30%, 8%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 8px;
          padding: 10px;
          color: white;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid hsl(217, 20%, 14%);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .secondary-btn {
          background: hsl(217, 20%, 16%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
