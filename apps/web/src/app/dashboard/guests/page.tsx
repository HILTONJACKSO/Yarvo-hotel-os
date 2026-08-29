'use client';

import { useState, useEffect } from 'react';
import { AddGuestModal } from '@/components/guests/AddGuestModal';

type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  createdAt: string;
};

type PaginatedResponse = {
  data: Guest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGuests = (searchQuery = '') => {
    setLoading(true);
    fetch(`/api/v1/guests?search=${encodeURIComponent(searchQuery)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');
        if (data.data && Array.isArray(data.data)) {
          setGuests(data.data);
          setMeta(data.meta);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch guests', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuests(search);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Guests</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Add Guest</button>
      </div>

      <AddGuestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchGuests(search)}
      />

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">Loading guests...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Nationality</th>
                <th>Registered</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">No guests found.</td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id}>
                    <td className="font-medium">
                      {guest.lastName}, {guest.firstName}
                    </td>
                    <td>
                      <div className="contact-info">
                        {guest.email && <span className="contact-item">✉️ {guest.email}</span>}
                        {guest.phone && <span className="contact-item">📞 {guest.phone}</span>}
                        {!guest.email && !guest.phone && <span className="text-muted">No contact info</span>}
                      </div>
                    </td>
                    <td>{guest.nationality || '-'}</td>
                    <td>{new Date(guest.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button className="action-btn">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {meta && meta.totalPages > 1 && (
            <div className="pagination">
              <span className="page-info">
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total guests)
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .btn-primary { background: hsl(43, 96%, 56%); color: hsl(224, 39%, 4%); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-secondary { background: transparent; color: hsl(210, 40%, 92%); border: 1px solid hsl(217, 20%, 18%); padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-secondary:hover { background: hsl(217, 20%, 18%); }

        .filters-bar { background: hsl(222, 35%, 7%); padding: 16px; border-radius: 8px; border: 1px solid hsl(217, 20%, 14%); }
        .search-form { display: flex; gap: 12px; max-width: 500px; }
        .input-field { flex: 1; background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 18%); color: hsl(210, 40%, 96%); padding: 8px 12px; border-radius: 6px; outline: none; }
        .input-field:focus { border-color: hsl(43, 96%, 56%); }
        
        .table-container { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 700px; }
        .data-table th { background: hsl(220, 30%, 5%); padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; color: hsl(215, 20%, 50%); font-weight: 600; border-bottom: 1px solid hsl(217, 20%, 14%); }
        .data-table td { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 12%); color: hsl(210, 40%, 92%); font-size: 0.875rem; }
        .data-table tbody tr:hover { background: hsl(220, 30%, 8%); }
        
        .font-medium { font-weight: 500; }
        .contact-info { display: flex; flex-direction: column; gap: 4px; }
        .contact-item { font-size: 0.8125rem; color: hsl(215, 20%, 65%); }
        .text-muted { color: hsl(215, 20%, 40%); font-style: italic; }
        
        .actions-col { width: 100px; text-align: right; }
        .actions-cell { text-align: right; }
        .action-btn { background: transparent; border: 1px solid hsl(217, 20%, 18%); color: hsl(210, 40%, 92%); padding: 4px 12px; border-radius: 6px; cursor: pointer; }
        .action-btn:hover { background: hsl(217, 20%, 18%); }
        
        .empty-state { text-align: center; padding: 40px !important; color: hsl(215, 20%, 50%) !important; }
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }
        
        .pagination { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid hsl(217, 20%, 14%); }
        .page-info { font-size: 0.8125rem; color: hsl(215, 20%, 50%); }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
          .btn-primary { width: 100%; }
          .search-form { flex-direction: column; max-width: 100%; }
          .btn-secondary { width: 100%; }
        }
      `}</style>
    </div>
  );
}

