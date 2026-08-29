'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, DollarSign, Search, Plus, CreditCard } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type EventSpace = {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  pricePerDay: number;
  isActive: boolean;
};

type EventBooking = {
  id: string;
  spaceId: string;
  space?: EventSpace;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  eventType: string;
  attendeesCount: number;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalAmount: number;
  amountPaid: number;
  specialRequests: string;
};

export default function EventsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'spaces'>('calendar');
  
  const [spaces, setSpaces] = useState<EventSpace[]>([]);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [spacesRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/events/spaces`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/events/bookings`, { credentials: 'include' })
      ]);
      
      const spacesData = await spacesRes.json();
      const bookingsData = await bookingsRes.json();
      
      setSpaces(Array.isArray(spacesData.data) ? spacesData.data : (Array.isArray(spacesData) ? spacesData : []));
      setBookings(Array.isArray(bookingsData.data) ? bookingsData.data : (Array.isArray(bookingsData) ? bookingsData : []));
    } catch (err) {
      console.error('Failed to fetch events data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Event Management</h1>
        <p className="page-description">Manage event spaces, conference rooms, and bookings.</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button 
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          List View
        </button>
        <button 
          className={`tab ${activeTab === 'spaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('spaces')}
        >
          Event Spaces
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(215, 20%, 65%)' }}>Loading...</div>
      ) : (
        <>
          {activeTab === 'calendar' && <CalendarTab bookings={bookings} spaces={spaces} refresh={fetchData} />}
          {activeTab === 'bookings' && <BookingsTab bookings={bookings} spaces={spaces} refresh={fetchData} />}
          {activeTab === 'spaces' && <SpacesTab spaces={spaces} refresh={fetchData} />}
        </>
      )}

        <style>{`
        .page-container { display: flex; flex-direction: column; gap: 32px; padding: 8px; }
        .page-header { display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid hsl(217, 20%, 14%); padding-bottom: 16px; }
        .page-title { margin: 0; color: hsl(210, 40%, 96%); font-weight: 600; font-size: 1.5rem; }
        .page-description { margin: 0; color: hsl(215, 20%, 65%); font-size: 0.9375rem; }
        
        .tabs { display: flex; gap: 8px; background: hsl(222, 35%, 12%); padding: 4px; border-radius: 8px; border: 1px solid hsl(217, 20%, 18%); width: fit-content; }
        .tab { background: transparent; border: none; color: hsl(215, 20%, 65%); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9375rem; transition: all 0.2s; font-weight: 500; }
        .tab:hover { color: hsl(210, 40%, 96%); }
        .tab.active { background: hsl(217, 20%, 20%); color: hsl(210, 40%, 96%); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        
        .panel { background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); border-radius: 12px; padding: 24px; }
        .panel h3 { margin: 0; color: hsl(210, 40%, 96%); font-size: 1.25rem; }
        
        .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { color: hsl(215, 20%, 65%); font-size: 0.875rem; font-weight: 500; }
        .form-input, .form-select { background: hsl(222, 35%, 12%); border: 1px solid hsl(217, 20%, 18%); color: white; padding: 10px 12px; border-radius: 6px; font-size: 0.9375rem; }
        .form-input:focus, .form-select:focus { outline: none; border-color: hsl(210, 100%, 50%); }
        
        .form-select { 
          appearance: none; 
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='hsl(215, 20%, 65%)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 40px;
        }
        
        .btn-primary { background: hsl(210, 100%, 50%); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { background: hsl(210, 100%, 45%); }
        .btn-secondary { background: hsl(217, 20%, 20%); color: white; border: 1px solid hsl(217, 20%, 30%); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
        
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 12px 16px; color: hsl(215, 20%, 65%); font-size: 0.875rem; font-weight: 500; border-bottom: 1px solid hsl(217, 20%, 18%); }
        .data-table td { padding: 16px; border-bottom: 1px solid hsl(217, 20%, 14%); color: hsl(210, 40%, 96%); font-size: 0.9375rem; }
        .data-table tbody tr:hover { background: hsl(222, 35%, 12%); }
        
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
        .status-badge.confirmed { background: hsl(142, 60%, 20%); color: hsl(142, 70%, 70%); }
        .status-badge.pending { background: hsl(35, 60%, 20%); color: hsl(35, 70%, 70%); }
        .status-badge.cancelled { background: hsl(0, 60%, 20%); color: hsl(0, 70%, 70%); }
        .status-badge.completed { background: hsl(210, 60%, 20%); color: hsl(210, 70%, 70%); }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 24px; }
        .modal-content { background: hsl(222, 35%, 10%); border: 1px solid hsl(217, 20%, 18%); border-radius: 12px; width: 500px; max-width: 100%; display: flex; flex-direction: column; max-height: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .modal-header { padding: 24px 24px 16px; flex-shrink: 0; }
        .modal-header h3 { margin: 0; color: white; font-size: 1.25rem; }
        .modal-body { padding: 0 24px; overflow-y: auto; flex-grow: 1; }
        .modal-footer { padding: 16px 24px 24px; display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0; border-top: 1px solid hsl(217, 20%, 14%); margin-top: 16px; }
      `}</style>
    </div>
  );
}

// -----------------------------------------------------------------------------
// CALENDAR TAB
// -----------------------------------------------------------------------------
function CalendarTab({ bookings, spaces, refresh }: { bookings: EventBooking[], spaces: EventSpace[], refresh: () => void }) {
  // Simple grouping by Date
  const groupedBookings = bookings.reduce((acc, booking) => {
    const date = new Date(booking.startTime).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, EventBooking[]>);

  const sortedDates = Object.keys(groupedBookings).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="panel">
      <div className="header-actions">
        <h3>Booking Calendar (Schedule)</h3>
      </div>
      
      {sortedDates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(215, 20%, 65%)' }}>No scheduled events.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedDates.map(date => (
            <div key={date} style={{ border: '1px solid hsl(215, 20%, 25%)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: 'hsl(215, 25%, 20%)', padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid hsl(215, 20%, 25%)' }}>
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedBookings[date].map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'hsl(215, 20%, 12%)', padding: '12px', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'hsl(215, 100%, 70%)' }}>
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '1.1rem', marginTop: '4px' }}>{b.eventType} ({b.guestName})</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(215, 20%, 65%)' }}>
                        <MapPin size={14} /> {b.space?.name || 'Unknown'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(215, 20%, 65%)', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <Users size={14} /> {b.attendeesCount} pax
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// BOOKINGS TAB
// -----------------------------------------------------------------------------
function BookingsTab({ bookings, spaces, refresh }: { bookings: EventBooking[], spaces: EventSpace[], refresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<EventBooking | null>(null);

  const handleOpenNew = () => {
    setEditingBooking(null);
    setShowModal(true);
  };

  return (
    <div className="panel">
      <div className="header-actions">
        <h3>Upcoming Bookings</h3>
        <button className="btn-primary" onClick={handleOpenNew}>
          <Plus size={16} /> New Booking
        </button>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Event Details</th>
            <th>Space</th>
            <th>Date & Time</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>
                <div style={{ fontWeight: 600 }}>{b.eventType}</div>
                <div style={{ fontSize: '0.85rem', color: 'hsl(215, 20%, 65%)' }}>{b.guestName} ({b.attendeesCount} pax)</div>
              </td>
              <td>{b.space?.name || 'Unknown Space'}</td>
              <td>
                <div>{new Date(b.startTime).toLocaleDateString()}</div>
                <div style={{ fontSize: '0.85rem', color: 'hsl(215, 20%, 65%)' }}>
                  {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td>
                <span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span>
              </td>
              <td>
                <div style={{ fontWeight: 600 }}>${Number(b.totalAmount).toFixed(2)}</div>
                <div style={{ fontSize: '0.85rem', color: Number(b.amountPaid) >= Number(b.totalAmount) ? 'hsl(142, 70%, 45%)' : 'hsl(35, 90%, 50%)' }}>
                  Paid: ${Number(b.amountPaid).toFixed(2)}
                </div>
              </td>
              <td>
                <button className="btn-secondary" onClick={() => { setEditingBooking(b); setShowModal(true); }}>Edit</button>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(215, 20%, 65%)' }}>No event bookings found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <BookingModal 
          booking={editingBooking} 
          spaces={spaces} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); refresh(); }} 
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SPACES TAB
// -----------------------------------------------------------------------------
function SpacesTab({ spaces, refresh }: { spaces: EventSpace[], refresh: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState<EventSpace | null>(null);

  const handleOpenNew = () => {
    setEditingSpace(null);
    setShowModal(true);
  };

  return (
    <div className="panel">
      <div className="header-actions">
        <h3>Event Spaces</h3>
        <button className="btn-primary" onClick={handleOpenNew}>
          <Plus size={16} /> Add Space
        </button>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Capacity</th>
            <th>Hourly Rate</th>
            <th>Daily Rate</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {spaces.map(s => (
            <tr key={s.id}>
              <td style={{ fontWeight: 600 }}>{s.name}</td>
              <td>{s.capacity} pax</td>
              <td>${Number(s.pricePerHour).toFixed(2)} / hr</td>
              <td>${Number(s.pricePerDay).toFixed(2)} / day</td>
              <td>
                <span className={`status-badge ${s.isActive ? 'confirmed' : 'cancelled'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button className="btn-secondary" onClick={() => { setEditingSpace(s); setShowModal(true); }}>Edit</button>
              </td>
            </tr>
          ))}
          {spaces.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(215, 20%, 65%)' }}>No event spaces configured.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <SpaceModal 
          space={editingSpace} 
          onClose={() => setShowModal(false)} 
          onSave={() => { setShowModal(false); refresh(); }} 
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// MODALS
// -----------------------------------------------------------------------------

function BookingModal({ booking, spaces, onClose, onSave }: any) {
  const [spaceId, setSpaceId] = useState(booking?.spaceId || (spaces[0]?.id || ''));
  const [guestName, setGuestName] = useState(booking?.guestName || '');
  const [guestPhone, setGuestPhone] = useState(booking?.guestPhone || '');
  const [guestEmail, setGuestEmail] = useState(booking?.guestEmail || '');
  const [eventType, setEventType] = useState(booking?.eventType || '');
  const [attendeesCount, setAttendeesCount] = useState(booking?.attendeesCount || 10);
  
  // Basic date-time formatting for input type="datetime-local"
  const formatForInput = (dateString?: string) => {
    if (!dateString) return new Date().toISOString().slice(0, 16);
    return new Date(dateString).toISOString().slice(0, 16);
  };
  
  const [startTime, setStartTime] = useState(formatForInput(booking?.startTime));
  const [endTime, setEndTime] = useState(formatForInput(booking?.endTime));
  const [status, setStatus] = useState(booking?.status || 'PENDING');
  const [totalAmount, setTotalAmount] = useState(Number(booking?.totalAmount || 0));
  const [amountPaid, setAmountPaid] = useState(Number(booking?.amountPaid || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      spaceId, guestName, guestPhone, guestEmail, eventType,
      attendeesCount: Number(attendeesCount),
      startTime, endTime, status,
      totalAmount: Number(totalAmount),
      amountPaid: Number(amountPaid)
    };

    const url = booking ? `${API_URL}/api/v1/events/bookings/${booking.id}` : `${API_URL}/api/v1/events/bookings`;
    const method = booking ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) onSave();
      else alert('Failed to save booking');
    } catch (err) {
      console.error(err);
      alert('Error saving booking');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{booking ? 'Edit Booking' : 'New Event Booking'}</h3>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full">
                <label>Event Space</label>
                <select className="form-select" value={spaceId} onChange={e => setSpaceId(e.target.value)} required>
                  {spaces.map((s: any) => <option key={s.id} value={s.id}>{s.name} - ${Number(s.pricePerHour).toFixed(2)}/hr</option>)}
                </select>
              </div>
              
              <div className="form-group">
                <label>Guest/Organizer Name</label>
                <input className="form-input" value={guestName} onChange={e => setGuestName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-input" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Event Type</label>
                <input className="form-input" placeholder="e.g. Wedding, Conference" value={eventType} onChange={e => setEventType(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Attendees</label>
                <input className="form-input" type="number" value={attendeesCount} onChange={e => setAttendeesCount(Number(e.target.value))} />
              </div>
              
              <div className="form-group">
                <label>Start Time</label>
                <input className="form-input" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input className="form-input" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Total Amount (USD)</label>
                <input className="form-input" type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Amount Paid (USD)</label>
                <input className="form-input" type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SpaceModal({ space, onClose, onSave }: any) {
  const [name, setName] = useState(space?.name || '');
  const [capacity, setCapacity] = useState(space?.capacity || 50);
  const [pricePerHour, setPricePerHour] = useState(Number(space?.pricePerHour || 100));
  const [pricePerDay, setPricePerDay] = useState(Number(space?.pricePerDay || 800));
  const [isActive, setIsActive] = useState(space ? space.isActive : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, capacity: Number(capacity), pricePerHour: Number(pricePerHour), pricePerDay: Number(pricePerDay), isActive };

    const url = space ? `${API_URL}/api/v1/events/spaces/${space.id}` : `${API_URL}/api/v1/events/spaces`;
    const method = space ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) onSave();
      else alert('Failed to save space');
    } catch (err) {
      console.error(err);
      alert('Error saving space');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{space ? 'Edit Space' : 'New Event Space'}</h3>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full">
                <label>Space Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input className="form-input" type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hourly Rate (USD)</label>
                <input className="form-input" type="number" step="0.01" value={pricePerHour} onChange={e => setPricePerHour(Number(e.target.value))} required />
              </div>
              <div className="form-group">
                <label>Daily Rate (USD)</label>
                <input className="form-input" type="number" step="0.01" value={pricePerDay} onChange={e => setPricePerDay(Number(e.target.value))} required />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Space</button>
          </div>
        </form>
      </div>
    </div>
  );
}

