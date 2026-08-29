'use client';

import { useState, useEffect } from 'react';
import { AddRoomTypeModal } from '@/components/room-types/AddRoomTypeModal';
import { EditRoomTypeModal } from '@/components/room-types/EditRoomTypeModal';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, Trash2 } from 'lucide-react';

type RoomType = {
  id: string;
  name: string;
  code: string;
  description: string;
  maxOccupancy: number;
  baseRateUsd: number;
  totalRooms: number;
};

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editRoomType, setEditRoomType] = useState<RoomType | null>(null);
  
  // Custom Delete Modal State
  const [roomToDelete, setRoomToDelete] = useState<RoomType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRoomTypes = () => {
    setLoading(true);
    fetch('/api/v1/room-types')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');
        if (data.data && Array.isArray(data.data)) {
          setRoomTypes(data.data);
        } else if (Array.isArray(data)) {
          setRoomTypes(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch room types', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/room-types/${roomToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to delete room type');
      }
      setRoomToDelete(null);
      fetchRoomTypes();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Room Types</h2>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>Add Room Type</button>
      </div>

      <AddRoomTypeModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRoomTypes}
      />

      <EditRoomTypeModal
        isOpen={!!editRoomType}
        onClose={() => setEditRoomType(null)}
        onSuccess={fetchRoomTypes}
        roomType={editRoomType}
      />

      {loading ? (
        <div className="loading-state">Loading room types...</div>
      ) : (
        <div className="room-types-grid">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="room-type-card">
              <div className="card-header">
                <h3>{rt.name}</h3>
                <span className="badge">{rt.code}</span>
              </div>
              <p className="description">{rt.description}</p>
              <div className="card-stats">
                <div className="stat">
                  <span className="label">Rate</span>
                  <span className="value">${rt.baseRateUsd}/night</span>
                </div>
                <div className="stat">
                  <span className="label">Occupancy</span>
                  <span className="value">Up to {rt.maxOccupancy}</span>
                </div>
                <div className="stat">
                  <span className="label">Total Rooms</span>
                  <span className="value">{rt.totalRooms}</span>
                </div>
              </div>
              <div className="card-actions">
                <button className="btn-danger-outline" onClick={() => setRoomToDelete(rt)}>Delete</button>
                <button className="btn-secondary" onClick={() => setEditRoomType(rt)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <Modal isOpen={!!roomToDelete} onClose={() => { if (!isDeleting) setRoomToDelete(null); }} title="Delete Room Type">
        <div className="delete-modal-content">
          <div className="delete-icon-wrapper">
            <Trash2 size={32} className="text-danger" />
          </div>
          <h3 className="delete-title">Are you sure?</h3>
          <p className="delete-desc">
            You are about to delete the <strong>{roomToDelete?.name}</strong> room type. 
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
        .page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-header h2 {
          margin: 0;
          color: hsl(210, 40%, 96%);
          font-weight: 600;
        }
        .btn-primary {
          background: hsl(43, 96%, 56%);
          color: hsl(224, 39%, 4%);
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .room-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .room-type-card {
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .card-header h3 {
          margin: 0;
          color: hsl(210, 40%, 96%);
          font-size: 1.125rem;
        }
        .badge {
          background: hsl(217, 20%, 18%);
          color: hsl(215, 20%, 65%);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .description {
          margin: 0;
          color: hsl(215, 20%, 55%);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .card-stats {
          display: flex;
          gap: 16px;
          background: hsl(220, 30%, 5%);
          padding: 12px;
          border-radius: 8px;
        }
        .stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat .label {
          font-size: 0.75rem;
          color: hsl(215, 20%, 50%);
        }
        .stat .value {
          font-size: 0.875rem;
          color: hsl(210, 40%, 92%);
          font-weight: 500;
        }
        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: auto;
        }
        .btn-secondary {
          background: transparent;
          color: hsl(210, 40%, 92%);
          border: 1px solid hsl(217, 20%, 18%);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: hsl(217, 20%, 18%);
        }
        .btn-danger-outline {
          background: transparent;
          color: hsl(0, 84%, 65%);
          border: 1px solid hsl(0, 84%, 60%, 0.3);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .btn-danger-outline:hover {
          background: hsl(0, 84%, 60%, 0.1);
        }

        /* Delete Modal Styles */
        .delete-modal-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 10px 0;
        }
        .delete-icon-wrapper {
          background: hsl(0, 84%, 60%, 0.1);
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .text-danger {
          color: hsl(0, 84%, 65%);
        }
        .delete-title {
          margin: 0 0 12px;
          color: hsl(210, 40%, 96%);
          font-size: 1.25rem;
          font-weight: 600;
        }
        .delete-desc {
          margin: 0;
          color: hsl(215, 20%, 65%);
          font-size: 0.9375rem;
          line-height: 1.5;
        }
        .delete-desc strong {
          color: hsl(210, 40%, 96%);
        }
        .delete-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          margin-top: 32px;
        }
        .delete-actions button {
          flex: 1;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid hsl(217, 20%, 25%);
          color: hsl(210, 40%, 96%);
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: hsl(217, 20%, 18%); }
        .btn-danger-filled {
          background: hsl(0, 84%, 60%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-danger-filled:hover {
          background: hsl(0, 84%, 65%);
        }
        .btn-danger-filled:disabled, .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .mt-4 { margin-top: 16px; }
        .error-alert {
          display: flex; align-items: center; gap: 8px; padding: 12px;
          background: hsl(0, 84%, 60%, 0.1); border: 1px solid hsl(0, 84%, 60%, 0.3);
          border-radius: 8px; color: hsl(0, 84%, 65%); font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

