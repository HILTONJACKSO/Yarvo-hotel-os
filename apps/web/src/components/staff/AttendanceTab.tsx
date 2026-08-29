import React, { useState, useEffect } from 'react';

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type Attendance = {
  id: string;
  userId: string;
  user?: User;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: string;
  notes?: string;
};

export function AttendanceTab({ staff }: { staff: User[] }) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

  const [clockInUserId, setClockInUserId] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/staff/attendance?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        setAttendances(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateStr]);

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInUserId) return;
    try {
      const res = await fetch('/api/v1/staff/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clockInUserId })
      });
      if (res.ok) {
        setClockInUserId('');
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClockOut = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/staff/attendance/${id}/clock-out`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <input 
          type="date" 
          value={dateStr} 
          onChange={(e) => setDateStr(e.target.value)} 
          className="form-input"
        />
        
        <form className="clock-in-form" onSubmit={handleClockIn}>
          <select value={clockInUserId} onChange={e => setClockInUserId(e.target.value)} required className="form-input">
            <option value="">Select Staff to Clock In</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Clock In Now</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">Loading attendance...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">No attendance records for this date.</td>
                </tr>
              ) : (
                attendances.map(record => (
                  <tr key={record.id}>
                    <td>{record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown'}</td>
                    <td>{new Date(record.clockIn).toLocaleTimeString()}</td>
                    <td>{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '--'}</td>
                    <td>
                      <span className={`status-badge ${record.status.toLowerCase()}`}>{record.status}</span>
                    </td>
                    <td>
                      {!record.clockOut && (
                        <button className="action-btn" onClick={() => handleClockOut(record.id)}>Clock Out</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .attendance-container { display: flex; flex-direction: column; gap: 16px; }
        .attendance-header { display: flex; justify-content: space-between; align-items: center; }
        .clock-in-form { display: flex; gap: 8px; }
        .form-input { padding: 8px 12px; border-radius: 6px; border: 1px solid hsl(217, 20%, 18%); background: hsl(220, 30%, 5%); color: hsl(210, 40%, 96%); }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; }
        .status-badge.present { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
        .status-badge.late { background: hsl(43, 96%, 56%, 0.15); color: hsl(43, 96%, 56%); }
        .status-badge.absent { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); }
      `}</style>
    </div>
  );
}

