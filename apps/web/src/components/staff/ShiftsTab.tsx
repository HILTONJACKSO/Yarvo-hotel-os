import React, { useState, useEffect } from 'react';

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type Shift = {
  id: string;
  userId: string;
  user?: User;
  date: string;
  startTime: string;
  endTime: string;
  department: string;
  status: string;
};

export function ShiftsTab({ staff }: { staff: User[] }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  // New Shift Form State
  const [userId, setUserId] = useState('');
  const [department, setDepartment] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/staff/shifts?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        setShifts(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch shifts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [dateStr]);

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/staff/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: dateStr,
          startTime: `${dateStr}T${startTime}:00.000Z`,
          endTime: `${dateStr}T${endTime}:00.000Z`,
          department,
          status: 'SCHEDULED'
        })
      });
      if (res.ok) {
        setIsAdding(false);
        fetchShifts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="shifts-container">
      <div className="shifts-header">
        <input 
          type="date" 
          value={dateStr} 
          onChange={(e) => setDateStr(e.target.value)} 
          className="form-input"
        />
        <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : '+ Schedule Shift'}
        </button>
      </div>

      {isAdding && (
        <form className="add-shift-form" onSubmit={handleAddShift}>
          <select value={userId} onChange={e => setUserId(e.target.value)} required className="form-input">
            <option value="">Select Staff</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
          <input type="text" placeholder="Department" value={department} onChange={e => setDepartment(e.target.value)} required className="form-input" />
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="form-input" />
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="form-input" />
          <button type="submit" className="btn-primary">Save Shift</button>
        </form>
      )}

      {loading ? (
        <div className="loading-state">Loading shifts...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Department</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">No shifts scheduled for this date.</td>
                </tr>
              ) : (
                shifts.map(shift => (
                  <tr key={shift.id}>
                    <td>{shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : 'Unknown'}</td>
                    <td>{shift.department}</td>
                    <td>
                      {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <span className={`status-badge ${shift.status.toLowerCase()}`}>{shift.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .shifts-container { display: flex; flex-direction: column; gap: 16px; }
        .shifts-header { display: flex; justify-content: space-between; align-items: center; }
        .form-input { padding: 8px 12px; border-radius: 6px; border: 1px solid hsl(217, 20%, 18%); background: hsl(220, 30%, 5%); color: hsl(210, 40%, 96%); }
        .add-shift-form { display: flex; gap: 8px; padding: 16px; background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 18%); border-radius: 8px; flex-wrap: wrap; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; }
        .status-badge.scheduled { background: hsl(215, 20%, 25%); color: hsl(210, 40%, 96%); }
        .status-badge.completed { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
      `}</style>
    </div>
  );
}

