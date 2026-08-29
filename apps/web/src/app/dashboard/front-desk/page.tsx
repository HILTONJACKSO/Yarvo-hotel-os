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
  const [confirmAction, setConfirmAction] = useState<{message: string, onConfirm: () => void} | null>(null);

  // Check-Out Modal State
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [activeCheckOutRes, setActiveCheckOutRes] = useState<Reservation | null>(null);

  const fetchFrontDeskData = async () => {
    setLoading(true);
    try {
      // In a real app, we'd filter arrivals/departures by TODAY's date.
      // For now, we filter purely by Status to demonstrate the workflow.
      const [arrRes, inHouseRes] = await Promise.all([
        fetch('/api/v1/reservations?status=CONFIRMED'),
        fetch('/api/v1/reservations?status=CHECKED_IN'),
      ]);

      const arrData = await arrRes.json();
      const inHouseData = await inHouseRes.json();

      if (arrRes.ok && Array.isArray(arrData.data)) {
        setArrivals(arrData.data);
      }
      
      if (inHouseRes.ok && Array.isArray(inHouseData.data)) {
        setInHouse(inHouseData.data);
        // Simulate departures as anyone checked in (in a real app, this would be checked in + checkout date = today)
        setDepartures(inHouseData.data); 
      }
    } catch (error) {
      console.error('Failed to fetch front desk data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrontDeskData();
  }, []);

  const handleCheckIn = (resId: string, roomTypeId: string) => {
    setActiveReservationId(resId);
    setActiveRoomTypeId(roomTypeId);
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
      <div className="page-header">
        <h2>Front Desk Operations</h2>
      </div>

      <CheckInModal 
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={fetchFrontDeskData}
        reservationId={activeReservationId}
        roomTypeId={activeRoomTypeId}
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
                      <strong>{res.guest.lastName}, {res.guest.firstName}</strong>
                      <span className="text-muted">Conf: {res.confirmationCode}</span>
                      <span className="text-muted">Type: {res.roomType.name}</span>
                    </div>
                    <button className="btn-success" onClick={() => handleCheckIn(res.id, res.roomType.id)}>Check In</button>
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
                      <strong>{res.guest.lastName}, {res.guest.firstName}</strong>
                      <span className="text-muted">Room: {res.room?.number || 'Unknown'}</span>
                    </div>
                    <button className="btn-secondary" onClick={() => router.push('/dashboard/billing')}>View Folio</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departures Panel */}
        <div className="panel">
          <div className="panel-header">
            <h3>Departures (Pending Check-Out)</h3>
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
                      <strong>{res.guest.lastName}, {res.guest.firstName}</strong>
                      <span className="text-muted">Room: {res.room?.number || 'Unknown'}</span>
                    </div>
                    <button className="btn-danger" onClick={() => handleCheckOut(res)}>Check Out</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-container { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; }
        .page-header h2 { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        
        .panel { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 14%); border-radius: 8px; display: flex; flex-direction: column; height: 600px; }
        .panel-header { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 14%); display: flex; justify-content: space-between; align-items: center; background: hsl(220, 30%, 5%); border-radius: 8px 8px 0 0; }
        .panel-header h3 { margin: 0; font-size: 0.9375rem; color: hsl(210, 40%, 92%); }
        .badge { background: hsl(217, 20%, 18%); color: hsl(210, 40%, 96%); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
        
        .panel-body { padding: 16px; flex: 1; overflow-y: auto; }
        .empty-text { color: hsl(215, 20%, 50%); text-align: center; font-size: 0.875rem; margin-top: 40px; }
        
        .card-list { display: flex; flex-direction: column; gap: 12px; }
        .op-card { background: hsl(220, 30%, 5%); border: 1px solid hsl(217, 20%, 18%); padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
        .op-details { display: flex; flex-direction: column; gap: 4px; }
        .op-details strong { color: hsl(210, 40%, 92%); font-size: 0.875rem; }
        .text-muted { color: hsl(215, 20%, 60%); font-size: 0.75rem; }
        
        .btn-success { background: hsl(142, 76%, 36%); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; cursor: pointer; }
        .btn-success:hover { background: hsl(142, 76%, 40%); }
        
        .btn-danger { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); border: 1px solid hsl(0, 84%, 60%, 0.3); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; cursor: pointer; }
        .btn-danger:hover { background: hsl(0, 84%, 60%, 0.25); }
        
        .btn-secondary { background: transparent; color: hsl(210, 40%, 92%); border: 1px solid hsl(217, 20%, 18%); padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
        .btn-secondary:hover { background: hsl(217, 20%, 18%); }
        
        .loading-state { text-align: center; padding: 40px; color: hsl(215, 20%, 50%); }
      `}</style>
    </div>
  );
}

