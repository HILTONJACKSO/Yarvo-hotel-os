'use client';

import { useState, useEffect } from 'react';
import { NewReservationModal } from '@/components/reservations/NewReservationModal';
import { ManageReservationModal } from '@/components/reservations/ManageReservationModal';
import { RoomCalendar } from '@/components/reservations/RoomCalendar';

type Reservation = {
  id: string;
  confirmationCode: string;
  guest: { firstName: string; lastName: string };
  roomType: { name: string };
  room: { number: string } | null;
  status: string;
  checkInDate: string;
  checkOutDate: string;
};

type PaginatedResponse = {
  data: Reservation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [manageReservation, setManageReservation] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const fetchReservations = (status = '') => {
    setLoading(true);
    const url = status ? `/api/v1/reservations?status=${status}` : '/api/v1/reservations';
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');
        if (data.data && Array.isArray(data.data)) {
          setReservations(data.data);
          setMeta(data.meta);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch reservations', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchReservations(statusFilter);
    }
  }, [statusFilter, viewMode]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      CHECKED_IN: 'badge-success',
      CHECKED_OUT: 'badge-neutral',
      CANCELLED: 'badge-danger',
      NO_SHOW: 'badge-danger',
    };
    return `status-badge ${map[status] || 'badge-neutral'}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h2>Reservations</h2>
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsNewModalOpen(true)}>
          + New Reservation
        </button>
      </div>

      <NewReservationModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
        onSuccess={() => fetchReservations(statusFilter)} 
      />

      <ManageReservationModal
        isOpen={!!manageReservation}
        onClose={() => setManageReservation(null)}
        onSuccess={() => {
          setManageReservation(null);
          fetchReservations(statusFilter);
        }}
        reservation={manageReservation}
      />

      {viewMode === 'calendar' ? (
        <RoomCalendar />
      ) : (
        <>
          <div className="filters-bar">
            <div className="filter-group">
              <label>Filter by Status:</label>
              <select 
                className="select-field" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading reservations...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Conf #</th>
                    <th>Guest Name</th>
                    <th>Dates</th>
                    <th>Room Type / Room</th>
                    <th>Status</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">No reservations found.</td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res.id}>
                        <td className="font-mono">{res.confirmationCode}</td>
                        <td className="font-medium">
                          {res.guest.lastName}, {res.guest.firstName}
                        </td>
                        <td>
                          <div className="dates-info">
                            <span className="date-item">In: {new Date(res.checkInDate).toLocaleDateString()}</span>
                            <span className="date-item">Out: {new Date(res.checkOutDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <div>{res.roomType.name}</div>
                          <div className="text-muted">{res.room ? `Room ${res.room.number}` : 'Unassigned'}</div>
                        </td>
                        <td>
                          <span className={getStatusBadge(res.status)}>
                            {res.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="action-btn" onClick={() => setManageReservation(res)}>Manage</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .view-toggle {
          display: flex;
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 18%);
          border-radius: 6px;
          padding: 4px;
        }
        .toggle-btn {
          background: transparent;
          border: none;
          padding: 6px 16px;
          color: hsl(215, 20%, 65%);
          font-weight: 500;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .toggle-btn:hover { color: white; }
        .toggle-btn.active {
          background: hsl(217, 20%, 25%);
          color: white;
        }

        .btn-primary { background: hsl(43, 96%, 56%); color: hsl(224, 39%, 4%); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.9; }

        .filters-bar { background: hsl(222, 35%, 7%); padding: 16px; border-radius: 8px; border: 1px solid hsl(217, 20%, 14%); display: flex; gap: 20px; }
        .filter-group { display: flex; align-items: center; gap: 10px; }
        .filter-group label { color: hsl(215, 20%, 65%); font-size: 0.875rem; }
        .select-field { background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 18%); color: hsl(210, 40%, 96%); padding: 8px 12px; border-radius: 6px; outline: none; cursor: pointer; }
        .select-field:focus { border-color: hsl(43, 96%, 56%); }
        
        .table-container { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { background: hsl(220, 30%, 5%); padding: 12px 16px; font-size: 0.75rem; text-transform: uppercase; color: hsl(215, 20%, 50%); font-weight: 600; border-bottom: 1px solid hsl(217, 20%, 14%); }
        .data-table td { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 12%); color: hsl(210, 40%, 92%); font-size: 0.875rem; }
        .data-table tbody tr:hover { background: hsl(220, 30%, 8%); }
        
        .font-mono { font-family: monospace; letter-spacing: 1px; color: hsl(43, 96%, 56%); }
        .font-medium { font-weight: 500; }
        .dates-info { display: flex; flex-direction: column; gap: 4px; }
        .date-item { font-size: 0.8125rem; color: hsl(215, 20%, 75%); }
        .text-muted { color: hsl(215, 20%, 50%); font-size: 0.75rem; margin-top: 4px; }
        
        /* Status Badges */
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-warning { background: hsl(35, 100%, 50%, 0.15); color: hsl(35, 100%, 65%); }
        .badge-info { background: hsl(210, 100%, 50%, 0.15); color: hsl(210, 100%, 70%); }
        .badge-success { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
        .badge-danger { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); }
        .badge-neutral { background: hsl(215, 20%, 50%, 0.15); color: hsl(215, 20%, 65%); }
        
        .actions-col { width: 100px; text-align: right; }
        .actions-cell { text-align: right; }
        .action-btn { background: transparent; border: 1px solid hsl(217, 20%, 18%); color: hsl(210, 40%, 92%); padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .action-btn:hover { background: hsl(217, 20%, 18%); }
        
        .empty-state { text-align: center; padding: 40px !important; color: hsl(215, 20%, 50%) !important; }
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }
      `}</style>
    </div>
  );
}

