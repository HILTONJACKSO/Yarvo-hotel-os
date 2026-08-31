'use client';

import { useState, useEffect } from 'react';
import { AddRoomModal } from '@/components/rooms/AddRoomModal';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, Trash2 } from 'lucide-react';

type RoomType = {
  id: string;
  name: string;
  code: string;
};

type Room = {
  id: string;
  number: string;
  floor: number;
  status: string;
  roomType: RoomType;
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'hsl(142, 76%, 45%)',
  OCCUPIED: 'hsl(217, 91%, 60%)',
  DIRTY: 'hsl(35, 92%, 53%)',
  CLEAN: 'hsl(183, 74%, 42%)',
  OUT_OF_ORDER: 'hsl(0, 84%, 60%)',
  BLOCKED: 'hsl(215, 20%, 50%)',
  MAINTENANCE: 'hsl(28, 86%, 53%)',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // Custom Delete Modal State
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRooms = () => {
    setLoading(true);
    fetch('/api/v1/rooms')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');
        if (data.data && Array.isArray(data.data)) {
          setRooms(data.data);
        } else if (Array.isArray(data)) {
          setRooms(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch rooms', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/rooms/${roomToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to delete room');
      }
      setRoomToDelete(null);
      fetchRooms();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Rooms</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Add Room</button>
      </div>

      <AddRoomModal 
        isOpen={isModalOpen || !!roomToEdit} 
        onClose={() => { setIsModalOpen(false); setRoomToEdit(null); }} 
        onSuccess={fetchRooms} 
        initialData={roomToEdit}
      />

      <div className="filters-bar">
        <input type="text" placeholder="Search room number..." className="input-field" />
        <select className="select-field">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="OCCUPIED">Occupied</option>
          <option value="DIRTY">Dirty</option>
          <option value="OUT_OF_ORDER">Out of Order</option>
        </select>
        <select className="select-field">
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading rooms...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Floor</th>
                <th>Room Type</th>
                <th>Status</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">No rooms found. Add some to get started.</td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="font-medium">{room.number}</td>
                    <td>{room.floor}</td>
                    <td>
                      <span className="type-badge" title={room.roomType?.name}>
                        {room.roomType?.code || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-chip"
                        style={{
                          backgroundColor: `${STATUS_COLORS[room.status] || '#888'}20`,
                          color: STATUS_COLORS[room.status] || '#888',
                          borderColor: `${STATUS_COLORS[room.status] || '#888'}40`,
                        }}
                      >
                        {room.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="flex-actions">
                        <button className="btn-danger-outline-small" onClick={() => setRoomToDelete(room)}>Delete</button>
                        <button className="action-btn" onClick={() => setRoomToEdit(room)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <Modal isOpen={!!roomToDelete} onClose={() => { if (!isDeleting) setRoomToDelete(null); }} title="Delete Room">
        <div className="delete-modal-content">
          <div className="delete-icon-wrapper">
            <Trash2 size={32} className="text-danger" />
          </div>
          <h3 className="delete-title">Are you sure?</h3>
          <p className="delete-desc">
            You are about to delete room <strong>{roomToDelete?.number}</strong>. 
            This action cannot be undone.
          </p>
          
          {deleteError && (
            <div className="error-alert mt-4">
              <AlertCircle size={16} />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="delete-actions">
            <button 
              className="btn-cancel" 
              onClick={() => setRoomToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              className="btn-danger-filled" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        .btn-primary { background: hsl(43, 96%, 56%); color: hsl(224, 39%, 4%); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        
        .filters-bar {
          display: flex;
          gap: 16px;
          background: hsl(222, 35%, 7%);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid hsl(217, 20%, 14%);
        }
        .input-field, .select-field {
          background: hsl(220, 30%, 5%);
          border: 1px solid hsl(217, 20%, 18%);
          color: hsl(210, 40%, 96%);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          outline: none;
        }
        .input-field:focus, .select-field:focus { border-color: hsl(43, 96%, 56%); }
        
        .table-container {
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 700px;
        }
        .data-table th {
          background: hsl(220, 30%, 5%);
          padding: 12px 16px;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: hsl(215, 20%, 50%);
          font-weight: 600;
          letter-spacing: 0.05em;
          border-bottom: 1px solid hsl(217, 20%, 14%);
        }
        .data-table td {
          padding: 16px;
          border-bottom: 1px solid hsl(217, 20%, 12%);
          color: hsl(210, 40%, 92%);
          font-size: 0.875rem;
        }
        .data-table tbody tr:hover { background: hsl(220, 30%, 8%); }
        .data-table tbody tr:last-child td { border-bottom: none; }
        
        .font-medium { font-weight: 500; }
        
        .type-badge {
          background: hsl(217, 20%, 18%);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          color: hsl(215, 20%, 75%);
        }
        
        .status-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
          letter-spacing: 0.02em;
        }
        
        .actions-col { width: 140px; text-align: right; }
        .actions-cell { text-align: right; }
        .flex-actions { display: flex; justify-content: flex-end; gap: 8px; }

        .btn-danger-outline-small {
          background: transparent;
          color: hsl(0, 84%, 65%);
          border: 1px solid hsl(0, 84%, 60%, 0.3);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.8125rem;
          cursor: pointer;
        }
        .btn-danger-outline-small:hover {
          background: hsl(0, 84%, 60%, 0.1);
        }

        .action-btn {
          background: transparent;
          border: 1px solid hsl(217, 20%, 18%);
          color: hsl(210, 40%, 92%);
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8125rem;
        }
        .action-btn:hover { background: hsl(217, 20%, 18%); }
        
        .empty-state { text-align: center; padding: 40px !important; color: hsl(215, 20%, 50%) !important; }

        /* Delete Modal Styles */
        .delete-modal-content {
          display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10px 0;
        }
        .delete-icon-wrapper {
          background: hsl(0, 84%, 60%, 0.1); width: 64px; height: 64px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
        }
        .text-danger { color: hsl(0, 84%, 65%); }
        .delete-title { margin: 0 0 12px; color: hsl(210, 40%, 96%); font-size: 1.25rem; font-weight: 600; }
        .delete-desc { margin: 0; color: hsl(215, 20%, 65%); font-size: 0.9375rem; line-height: 1.5; }
        .delete-desc strong { color: hsl(210, 40%, 96%); }
        .delete-actions { display: flex; gap: 12px; width: 100%; margin-top: 32px; }
        .delete-actions button { flex: 1; }
        .btn-cancel {
          background: transparent; border: 1px solid hsl(217, 20%, 25%); color: hsl(210, 40%, 96%);
          padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { background: hsl(217, 20%, 18%); }
        .btn-danger-filled {
          background: hsl(0, 84%, 60%); color: white; border: none; padding: 10px 20px;
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-danger-filled:hover { background: hsl(0, 84%, 65%); }
        .btn-danger-filled:disabled, .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
        .mt-4 { margin-top: 16px; }
        .error-alert {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: hsl(0, 84%, 60%, 0.1); border: 1px solid hsl(0, 84%, 60%, 0.3);
          border-radius: 8px; color: hsl(0, 84%, 65%); font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
          .btn-primary { width: 100%; }
          .filters-bar { flex-direction: column; gap: 12px; }
          .input-field, .select-field { width: 100%; }
        }
      `}</style>
    </div>
  );
}

