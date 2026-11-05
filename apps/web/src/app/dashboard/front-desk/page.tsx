'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { useRouter } from 'next/navigation';
import { CheckInModal } from '@/components/front-desk/CheckInModal';
import { CheckOutModal } from '@/components/front-desk/CheckOutModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type Reservation = {
  id: string;
  confirmationCode: string;
  guest: { firstName: string; lastName: string };
  roomType: { name: string; id: string };
  room: { number: string; id: string } | null;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  folio?: { id: string };
};

export default function FrontDeskPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [inHouse, setInHouse] = useState<Reservation[]>([]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [activeRoomTypeId, setActiveRoomTypeId] = useState<string | null>(null);
  const [activePreAssignedRoomId, setActivePreAssignedRoomId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  // Check-Out Modal State
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [activeCheckOutRes, setActiveCheckOutRes] = useState<Reservation | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchFrontDeskData = async () => {
    setLoading(true);
    try {
      const [arrRes, inHouseRes, authRes, metRes] = await Promise.all([
        fetch('/api/v1/reservations?status=CONFIRMED', { credentials: 'include' }),
        fetch('/api/v1/reservations?status=CHECKED_IN', { credentials: 'include' }),
        fetch('/api/v1/auth/me', { credentials: 'include' }),
        fetch('/api/v1/analytics/dashboard', { credentials: 'include' })
      ]);

      const arrData = await arrRes.json().catch(() => ({}));
      const inHouseData = await inHouseRes.json().catch(() => ({}));
      const authData = await authRes.json().catch(() => ({}));
      const metData = await metRes.json().catch(() => ({}));

      const extractList = (d: any) => {
        if (Array.isArray(d?.data?.data)) return d.data.data;
        if (Array.isArray(d?.data)) return d.data;
        if (Array.isArray(d)) return d;
        return [];
      };

      if (arrRes.ok) {
        const allConfirmed = extractList(arrData).sort(
          (a: any, b: any) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
        );
        setArrivals(allConfirmed);
      }
      
      if (inHouseRes.ok) {
        const allCheckedIn = extractList(inHouseData).sort(
          (a: any, b: any) => new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime()
        );
        setInHouse(allCheckedIn);
        setDepartures(allCheckedIn);
      }

      if (authRes.ok) setCurrentUser(authData.data || authData);
      if (metRes.ok) setMetrics(metData.data || metData);

    } catch (error) {
      console.error('Failed to fetch front desk data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrontDeskData();
  }, []);

  const handleCheckIn = (res: any) => {
    setActiveReservationId(res.id);
    setActiveRoomTypeId(res.roomType?.id || res.roomTypeId);
    setActivePreAssignedRoomId(res.room ? res.room.id : (res.roomId || null));
    setIsCheckInOpen(true);
  };

  const handleCheckOut = (res: Reservation) => {
    setActiveCheckOutRes(res);
    setIsCheckOutOpen(true);
  };

  if (loading) {
    return <div className="loading-state">Loading Front Desk Operations...</div>;
  }

  return (
    <div className="page-container">
      <div className="welcome-banner" style={{ marginBottom: '28px' }}>
        <div className="welcome-text">
          <p className="welcome-greeting">Good day,</p>
          <h2 className="welcome-name">{currentUser?.firstName || 'Front Desk'} {currentUser?.lastName || ''}</h2>
          <p className="welcome-sub">Here&apos;s what&apos;s happening at your property today.</p>
        </div>
        <div className="welcome-badge">
          <span className="role-chip">FRONT DESK</span>
        </div>
      </div>

      <div className="coming-soon-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215, 20%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></div>
          <div className="stat-value">{loading ? '...' : (metrics?.occupancyRate || '0.0%')}</div>
          <div className="stat-title">Occupancy Rate</div>
          <div className="stat-desc">Live occupancy</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215, 20%, 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div>
          <div className="stat-value">{loading ? '...' : (metrics?.checkInsToday || 0)}</div>
          <div className="stat-title">Check-Ins Today</div>
          <div className="stat-desc">Scheduled arrivals</div>
        </div>
      </div>

      <div className="page-header">
        <h2>Front Desk Operations</h2>
      </div>

      <CheckInModal 
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={fetchFrontDeskData}
        reservationId={activeReservationId}
        roomTypeId={activeRoomTypeId}
        preAssignedRoomId={activePreAssignedRoomId}
      />

      <CheckOutModal 
        isOpen={isCheckOutOpen}
        onClose={() => setIsCheckOutOpen(false)}
        onSuccess={fetchFrontDeskData}
        reservation={activeCheckOutRes}
      />

      <ConfirmModal 
        isOpen={confirmAction !== null}
        title="Check Out Guest"
        message={confirmAction?.message || ''}
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
        isDanger={true}
        confirmText="Yes, Check Out"
      />

      <div className="dashboard-grid">
        {/* Arrivals Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3>Arrivals (Pending Check-In)</h3>
            <span className="badge">{arrivals.length}</span>
          </div>
          <div className="panel-body">
            {arrivals.length === 0 ? (
              <p className="empty-text">No arrivals pending.</p>
            ) : (
              <div className="card-list">
                {arrivals.map((res) => (
                  <div key={res.id} className="op-card">
                    <div className="op-details">
                      <strong>{res.guest?.firstName} {res.guest?.lastName}</strong>
                      <span className="text-muted" style={{ color: '#f59e0b', fontWeight: 600 }}>Ref: {res.confirmationCode}</span>
                      <span className="text-muted">Type: {res.roomType?.name} {res.room ? `(Room ${res.room.number})` : ''}</span>
                      <span className="text-muted">Check-In: {new Date(res.checkInDate).toLocaleDateString()}</span>
                    </div>
                    <button className="btn-success" onClick={() => handleCheckIn(res)}>Check In</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* In-House Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3>In-House Guests</h3>
            <span className="badge">{inHouse.length}</span>
          </div>
          <div className="panel-body">
            {inHouse.length === 0 ? (
              <p className="empty-text">No guests currently in-house.</p>
            ) : (
              <div className="card-list">
                {inHouse.map((res) => (
                  <div key={res.id} className="op-card">
                    <div className="op-details">
                      <strong>{res.guest?.firstName} {res.guest?.lastName}</strong>
                      <span className="text-muted" style={{ color: '#f59e0b', fontWeight: 600 }}>Ref: {res.confirmationCode}</span>
                      <span className="text-muted">Room: {res.room?.number || 'Unknown'}</span>
                    </div>
                    <div className="op-actions">
                      <button className="btn-secondary" onClick={() => router.push(`/dashboard/billing?reservationId=${res.id}`)}>View Bill</button>
                      <button className="btn-danger" onClick={() => handleCheckOut(res)}>Check Out</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departures Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3>Departures (Ready for Check-Out)</h3>
            <span className="badge">{departures.length}</span>
          </div>
          <div className="panel-body">
            {departures.length === 0 ? (
              <p className="empty-text">No departures pending.</p>
            ) : (
              <div className="card-list">
                {departures.map((res) => (
                  <div key={res.id} className="op-card">
                    <div className="op-details">
                      <strong>{res.guest?.firstName} {res.guest?.lastName}</strong>
                      <span className="text-muted" style={{ color: '#f59e0b', fontWeight: 600 }}>Ref: {res.confirmationCode}</span>
                      <span className="text-muted">Room: {res.room?.number || 'Unknown'} • Out: {new Date(res.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div className="op-actions">
                      <button className="btn-danger" onClick={() => handleCheckOut(res)}>Check Out</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; width: 100%; max-width: 100%; overflow-x: hidden; }
        .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; width: 100%; }
        
        .panel { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; display: flex; flex-direction: column; height: 600px; min-width: 0; overflow: hidden; }
        .panel-header { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 14%); display: flex; justify-content: space-between; align-items: center; gap: 8px; background: hsl(220, 30%, 5%); border-radius: 8px 8px 0 0; }
        .panel-header h3 { margin: 0; font-size: 0.9375rem; color: hsl(210, 40%, 92%); }
        .badge { background: hsl(217, 20%, 18%); color: hsl(210, 40%, 96%); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
        
        .panel-body { padding: 16px; flex: 1; overflow-y: auto; }
        .empty-text { color: hsl(215, 20%, 50%); text-align: center; font-size: 0.875rem; margin-top: 40px; }
        
        .card-list { display: flex; flex-direction: column; gap: 12px; }
        .op-card { background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 18%); padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .op-details { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1 1 160px; }
        .op-details strong { color: hsl(210, 40%, 92%); font-size: 0.875rem; word-break: break-word; }
        .text-muted { color: hsl(215, 20%, 60%); font-size: 0.75rem; }
        .op-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        
        .btn-success { background: hsl(142, 76%, 36%); color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; cursor: pointer; white-space: nowrap; }
        .btn-success:hover { background: hsl(142, 76%, 40%); }
        
        .btn-danger { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.3); padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; cursor: pointer; white-space: nowrap; }
        .btn-danger:hover { background: hsl(0, 84%, 60%, 0.25); }
        
        .btn-secondary { background: transparent; color: hsl(210, 40%, 92%); border: 1px solid hsl(217, 20%, 18%); padding: 7px 14px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; white-space: nowrap; }
        .btn-secondary:hover { background: hsl(217, 20%, 18%); }
        
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }

        @media (max-width: 1100px) {
          .dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        }

        @media (max-width: 768px) {
          .welcome-banner { flex-direction: column; align-items: flex-start; gap: 14px; padding: 20px; }
          .dashboard-grid { grid-template-columns: 1fr; gap: 16px; }
          .panel { height: auto; max-height: 460px; min-height: 220px; }
          .op-card { flex-direction: column; align-items: stretch; gap: 10px; }
          .op-details { flex: 1 1 auto; }
          .op-actions { width: 100%; justify-content: flex-end; }
          .op-actions button, .op-card > button { flex: 1; text-align: center; padding: 9px 12px; }
        }
      `}</style>
    </div>
  );
}

