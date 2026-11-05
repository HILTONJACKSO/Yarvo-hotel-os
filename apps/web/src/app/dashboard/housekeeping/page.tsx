'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { syncOfflineMutations, downloadLatestData } from '@/lib/sync';
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
  const rooms = useLiveQuery(() => db.rooms.toArray()) || [];
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  const fetchRooms = async (silent = false) => {
    try {
      if (!silent && rooms.length === 0) setLoading(true);
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/v1/rooms', { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
            if (arr.length > 0) {
              await db.rooms.clear();
              await db.rooms.bulkPut(arr);
            }
          }
        } catch (e) {}
        await downloadLatestData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        fetchRooms(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkClean = (id: string, number: string) => {
    setConfirmAction({
      message: `Are you sure you want to mark Room ${number} as clean?`,
      onConfirm: async () => {
        try {
          const room = await db.rooms.get(id);
          if (room) {
            (room as any).status = 'CLEAN';
            await db.rooms.put(room);
          }
          if (navigator.onLine) {
            const res = await fetch(`/api/v1/rooms/${id}/clean`, {
              method: 'PATCH',
              credentials: 'include',
            });
            if (!res.ok) {
              await fetch(`/api/v1/rooms/${id}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLEAN' }),
              });
            }
          } else {
            await db.syncQueue.add({
              url: `/api/v1/rooms/${id}/clean`,
              method: 'PATCH',
              payload: null,
              createdAt: Date.now(),
              status: 'PENDING',
              retryCount: 0
            });
          }

          showToast(`Room ${number} marked as clean`, 'success');
          setConfirmAction(null);
          fetchRooms(true);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleMarkDirty = (id: string, number: string) => {
    setConfirmAction({
      message: `Mark Room ${number} as Vacant Dirty for housekeeping?`,
      onConfirm: async () => {
        try {
          const room = await db.rooms.get(id);
          if (room) {
            (room as any).status = 'DIRTY';
            await db.rooms.put(room);
          }
          if (navigator.onLine) {
            await fetch(`/api/v1/rooms/${id}/status`, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'DIRTY' }),
            });
          }
          showToast(`Room ${number} marked as Vacant Dirty`, 'success');
          setConfirmAction(null);
          fetchRooms(true);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  if (loading && rooms.length === 0) return <div className="loading-state">Loading Housekeeping Board...</div>;

  const sortedRooms = [...rooms].sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
  const dirtyRooms = sortedRooms.filter(r => r.status === 'DIRTY');
  const occupiedRooms = sortedRooms.filter(r => r.status === 'OCCUPIED');
  const otherRooms = sortedRooms.filter(r => !['DIRTY', 'OCCUPIED'].includes(r.status));

  return (
    <div className="housekeeping-container">
      <ConfirmModal 
        isOpen={confirmAction !== null}
        title="Confirm Action"
        message={confirmAction?.message || ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
        isDanger={false}
        confirmText="Confirm"
      />
      
      <div className="page-header">
        <div>
          <h2>Housekeeping Board</h2>
          <p className="subtitle-text">Live room status across all rooms and tents</p>
        </div>
        <div className="stats">
          <span className="stat-badge stat-dirty">{dirtyRooms.length} Dirty</span>
          <span className="stat-badge stat-occupied">{occupiedRooms.length} Occupied</span>
          <button className="btn-refresh" onClick={() => fetchRooms(false)} title="Refresh Rooms">
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title text-danger">Action Required: Dirty Rooms ({dirtyRooms.length})</h3>
        {dirtyRooms.length === 0 ? (
          <p className="empty-text">No dirty rooms! Excellent job.</p>
        ) : (
          <div className="room-grid">
            {dirtyRooms.map(r => (
              <div key={r.id} className="room-card card-dirty">
                <div className="room-header">
                  <span className="room-num">{r.number}</span>
                  <span className="room-type">{r.roomType?.name || 'Room'}</span>
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
        <h3 className="section-title text-warning">In-House: Occupied Rooms (Daily Service) ({occupiedRooms.length})</h3>
        {occupiedRooms.length === 0 ? (
          <p className="empty-text">No occupied rooms right now.</p>
        ) : (
          <div className="room-grid">
            {occupiedRooms.map(r => (
              <div key={r.id} className="room-card card-occupied">
                <div className="room-header">
                  <span className="room-num">{r.number}</span>
                  <span className="room-type">{r.roomType?.name || 'Room'}</span>
                </div>
                <div className="room-footer" style={{ justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="status-label">Guest In-House</span>
                  <button className="btn-dirty-sm" onClick={() => handleMarkDirty(r.id, r.number)}>
                    Set Vacant Dirty
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">Clean & Available Rooms ({otherRooms.length})</h3>
        <div className="room-grid compact">
          {otherRooms.map(r => (
            <div key={r.id} className="room-card card-neutral">
              <div className="room-header">
                <span className="room-num">{r.number}</span>
                <span className="status-sm">{r.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(215, 20%, 60%)' }}>{r.roomType?.name || ''}</span>
                {r.status === 'CLEAN' && (
                  <button className="btn-dirty-sm" onClick={() => handleMarkDirty(r.id, r.number)}>
                    Mark Dirty
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .housekeeping-container { display: flex; flex-direction: column; gap: 28px; padding: 4px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; border-bottom: 1px solid hsl(217, 20%, 14%); padding-bottom: 16px; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; font-size: 1.5rem; }
        .subtitle-text { margin: 4px 0 0 0; font-size: 0.8125rem; color: hsl(215, 20%, 55%); }
        
        .stats { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .stat-badge { padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.8125rem; display: flex; align-items: center; gap: 6px; }
        .stat-dirty { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.25); }
        .stat-occupied { background: hsl(35, 100%, 50%, 0.15); color: hsl(35, 100%, 65%); border: 1px solid hsl(35, 100%, 50%, 0.25); }
        .btn-refresh { background: hsl(222, 35%, 14%); color: hsl(210, 40%, 90%); border: 1px solid hsl(217, 20%, 24%); padding: 6px 12px; border-radius: 20px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-refresh:hover { background: hsl(222, 35%, 20%); }

        .section-title { margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .text-danger { color: hsl(0, 84%, 65%); }
        .text-warning { color: hsl(35, 100%, 65%); }

        .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .room-grid.compact { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }

        .room-card { 
          background: hsl(222, 35%, 10%); 
          border: 1px solid; 
          border-radius: 12px; 
          padding: 18px; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between;
          gap: 16px; 
          min-height: 130px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .room-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }
        
        .card-dirty { border-color: hsl(0, 84%, 60%, 0.3); border-top: 4px solid hsl(0, 84%, 60%); }
        .card-occupied { border-color: hsl(35, 100%, 50%, 0.3); border-top: 4px solid hsl(35, 100%, 50%); }
        .card-neutral { border-color: hsl(217, 20%, 18%); padding: 14px; min-height: 95px; border-top: 4px solid hsl(217, 20%, 25%); }

        .room-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .room-num { font-size: 1.5rem; font-weight: 700; color: hsl(210, 40%, 96%); line-height: 1; letter-spacing: -0.02em; }
        .room-type { font-size: 0.75rem; color: hsl(215, 20%, 65%); text-align: right; background: hsl(222, 35%, 15%); padding: 4px 10px; border-radius: 12px; }
        .status-sm { font-size: 0.75rem; color: hsl(142, 70%, 55%); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .room-footer { display: flex; align-items: center; }
        
        .btn-clean { 
          width: 100%; 
          background: hsl(142, 76%, 36%, 0.15); 
          color: hsl(142, 76%, 50%); 
          border: 1px solid hsl(142, 76%, 36%, 0.3); 
          padding: 10px 12px; 
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

        .btn-dirty-sm {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-dirty-sm:hover { background: #ef4444; color: white; }

        .status-label { 
          font-size: 0.8125rem; 
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

        @media (max-width: 640px) {
          .room-grid { grid-template-columns: 1fr; }
          .room-grid.compact { grid-template-columns: repeat(2, 1fr); }
          .page-header h2 { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
}

