'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type Room = {
  id: string;
  number: string;
  floor: number;
  status: string;
  roomType: { name: string };
};

export default function HousekeepingPage() {
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/rooms');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRooms(data);
        } else if (data && Array.isArray(data.data)) {
          setRooms(data.data);
        } else {
          console.error("API did not return an array", data);
          setRooms([]);
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
    fetchRooms();
  }, []);

  const handleMarkClean = (id: string, number: string) => {
    setConfirmAction({
      message: `Are you sure you want to mark Room ${number} as clean?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/rooms/${id}/clean`, {
            method: 'PATCH',
          });
          if (res.ok) {
            fetchRooms();
          } else {
            const err = await res.json();
            showToast(`Failed: ${err.message}`, 'error', 'Error');
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  if (loading) return <div className="loading-state">Loading Housekeeping Board...</div>;

  const dirtyRooms = rooms.filter(r => r.status === 'DIRTY');
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED');
  const otherRooms = rooms.filter(r => !['DIRTY', 'OCCUPIED'].includes(r.status));

  return (
    <div className="housekeeping-container">
      <ConfirmModal 
        isOpen={confirmAction !== null}
        title="Confirm Action"
        message={confirmAction?.message || ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
        isDanger={false}
        confirmText="Yes, Mark Clean"
      />
      
      <div className="page-header">
        <h2>Housekeeping Board</h2>
        <div className="stats">
          <span className="stat-badge stat-dirty">{dirtyRooms.length} Dirty</span>
          <span className="stat-badge stat-occupied">{occupiedRooms.length} Occupied</span>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title text-danger">Action Required: Dirty Rooms</h3>
        {dirtyRooms.length === 0 ? (
          <p className="empty-text">No dirty rooms! Excellent job.</p>
        ) : (
          <div className="room-grid">
            {dirtyRooms.map(r => (
              <div key={r.id} className="room-card card-dirty">
                <div className="room-header">
                  <span className="room-num">{r.number}</span>
                  <span className="room-type">{r.roomType.name}</span>
                </div>
                <div className="room-footer">
                  <button className="btn-clean" onClick={() => handleMarkClean(r.id, r.number)}>
                    ✓ Mark Clean
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title text-warning">In-House: Occupied Rooms (Daily Service)</h3>
        <div className="room-grid">
          {occupiedRooms.map(r => (
            <div key={r.id} className="room-card card-occupied">
              <div className="room-header">
                <span className="room-num">{r.number}</span>
                <span className="room-type">{r.roomType.name}</span>
              </div>
              <div className="room-footer">
                <span className="status-label">Guest In-House</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">Other Rooms ({otherRooms.length})</h3>
        <div className="room-grid compact">
          {otherRooms.map(r => (
            <div key={r.id} className="room-card card-neutral">
              <div className="room-header">
                <span className="room-num">{r.number}</span>
                <span className="status-sm">{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .housekeeping-container { display: flex; flex-direction: column; gap: 32px; padding: 8px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid hsl(217, 20%, 14%); padding-bottom: 16px; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; font-size: 1.5rem; }
        
        .stats { display: flex; gap: 12px; }
        .stat-badge { padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 6px; }
        .stat-dirty { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.25); }
        .stat-occupied { background: hsl(35, 100%, 50%, 0.15); color: hsl(35, 100%, 65%); border: 1px solid hsl(35, 100%, 50%, 0.25); }

        .section-title { margin: 0 0 20px 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .text-danger { color: hsl(0, 84%, 65%); }
        .text-warning { color: hsl(35, 100%, 65%); }

        .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .room-grid.compact { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }

        .room-card { 
          background: hsl(222, 35%, 10%); 
          border: 1px solid; 
          border-radius: 12px; 
          padding: 20px; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between;
          gap: 20px; 
          min-height: 140px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .room-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }
        
        .card-dirty { border-color: hsl(0, 84%, 60%, 0.3); border-top: 4px solid hsl(0, 84%, 60%); }
        .card-occupied { border-color: hsl(35, 100%, 50%, 0.3); border-top: 4px solid hsl(35, 100%, 50%); }
        .card-neutral { border-color: hsl(217, 20%, 18%); padding: 16px; min-height: 100px; border-top: 4px solid hsl(217, 20%, 25%); }

        .room-header { display: flex; justify-content: space-between; align-items: center; }
        .room-num { font-size: 1.75rem; font-weight: 700; color: hsl(210, 40%, 96%); line-height: 1; letter-spacing: -0.02em; }
        .room-type { font-size: 0.8125rem; color: hsl(215, 20%, 65%); text-align: right; background: hsl(222, 35%, 15%); padding: 4px 10px; border-radius: 12px; }
        .status-sm { font-size: 0.75rem; color: hsl(215, 20%, 50%); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

        .room-footer { display: flex; align-items: center; }
        
        .btn-clean { 
          width: 100%; 
          background: hsl(142, 76%, 36%, 0.15); 
          color: hsl(142, 76%, 50%); 
          border: 1px solid hsl(142, 76%, 36%, 0.3); 
          padding: 12px; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 0.875rem;
          cursor: pointer; 
          transition: all 0.2s; 
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-clean:hover { background: hsl(142, 76%, 36%); color: white; }

        .status-label { 
          font-size: 0.875rem; 
          color: hsl(35, 100%, 65%); 
          font-weight: 600; 
          display: flex; 
          align-items: center; 
          gap: 6px; 
        }
        .status-label::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: hsl(35, 100%, 50%);
          box-shadow: 0 0 8px hsl(35, 100%, 50%);
        }
        
        .empty-text { color: hsl(215, 20%, 50%); font-style: italic; font-size: 0.9375rem; background: hsl(222, 35%, 10%); padding: 24px; border-radius: 12px; text-align: center; border: 1px dashed hsl(217, 20%, 20%); }
        .loading-state { text-align: center; padding: 60px; color: hsl(215, 20%, 60%); font-size: 1.125rem; display: flex; flex-direction: column; align-items: center; gap: 16px; }
      `}</style>
    </div>
  );
}

