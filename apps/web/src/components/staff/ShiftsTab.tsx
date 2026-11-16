import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { downloadCSV } from '@/utils/export';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  roles?: { id: string; name: string }[];
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

const DEPARTMENTS = [
  'Front Desk',
  'Housekeeping',
  'Kitchen',
  'Bar',
  'Restaurant / Waitstaff',
  'POS Cashier',
  'Boutique',
  'Pool & Beach / Tickets',
  'Tours & Activities',
  'Events & Banquets',
  'Maintenance',
  'Security',
  'Management / Admin',
];

const getCurrentTimeHHMM = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const toDateInputStr = (isoOrDate?: string) => {
  if (!isoOrDate) return new Date().toISOString().split('T')[0];
  return new Date(isoOrDate).toISOString().split('T')[0];
};

const toTimeInputStr = (iso?: string) => {
  if (!iso) return '08:00';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '08:00';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function ShiftsTab({ staff, isManager = true }: { staff: User[]; isManager?: boolean }) {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter range state
  const [filterStartDate, setFilterStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterUserId, setFilterUserId] = useState<string>('ALL');

  // Create / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [department, setDepartment] = useState('Front Desk');
  const [customDepartment, setCustomDepartment] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [shiftStatus, setShiftStatus] = useState('SCHEDULED');

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.set('startDate', filterStartDate);
      if (filterEndDate) params.set('endDate', filterEndDate);
      if (filterDepartment && filterDepartment !== 'ALL') params.set('department', filterDepartment);
      if (filterUserId && filterUserId !== 'ALL') params.set('userId', filterUserId);

      const res = await fetch(`/api/v1/staff/shifts?${params.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setShifts(json.data || json || []);
      }
    } catch (err) {
      console.error('Failed to fetch shifts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [filterStartDate, filterEndDate, filterDepartment, filterUserId]);

  const openCreateForm = () => {
    setEditingShiftId(null);
    setUserId('');
    setDepartment('Front Desk');
    setCustomDepartment('');
    setStartDate(todayStr);
    setEndDate(todayStr);
    setStartTime(getCurrentTimeHHMM());
    setEndTime('17:00');
    setShiftStatus('SCHEDULED');
    setIsFormOpen(true);
  };

  const openEditForm = (shift: Shift) => {
    setEditingShiftId(shift.id);
    setUserId(shift.userId);
    if (DEPARTMENTS.includes(shift.department)) {
      setDepartment(shift.department);
      setCustomDepartment('');
    } else {
      setDepartment('CUSTOM');
      setCustomDepartment(shift.department);
    }
    setStartDate(toDateInputStr(shift.startTime || shift.date));
    setEndDate(toDateInputStr(shift.endTime || shift.date));
    setStartTime(toTimeInputStr(shift.startTime));
    setEndTime(toTimeInputStr(shift.endTime));
    setShiftStatus(shift.status || 'SCHEDULED');
    setIsFormOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDept = department === 'CUSTOM' ? customDepartment.trim() : department;
    if (!userId || !finalDept) {
      showToast('Please select both a registered staff member and department.', 'error');
      return;
    }
    if (endDate < startDate) {
      showToast('Shift end date cannot be earlier than start date.', 'error');
      return;
    }

    const startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endIso = new Date(`${endDate}T${endTime}:00`).toISOString();

    try {
      const url = editingShiftId
        ? `/api/v1/staff/shifts/${editingShiftId}`
        : '/api/v1/staff/shifts';
      const method = editingShiftId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: startDate,
          startDate,
          endDate,
          startTime: startIso,
          endTime: endIso,
          department: finalDept,
          status: shiftStatus || 'SCHEDULED',
        }),
      });
      if (res.ok) {
        showToast(
          editingShiftId ? 'Shift schedule updated successfully!' : 'Shift schedule created!',
          'success',
        );
        setIsFormOpen(false);
        setEditingShiftId(null);
        fetchShifts();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to save shift schedule', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save shift schedule', 'error');
    }
  };

  const handleDeleteShift = async (shift: Shift) => {
    const staffName = shift.user ? `${shift.user.firstName} ${shift.user.lastName}` : 'this staff member';
    if (!confirm(`Are you sure you want to delete the shift schedule for ${staffName}?`)) return;
    try {
      const res = await fetch(`/api/v1/staff/shifts/${shift.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showToast('Shift schedule deleted.', 'success');
        fetchShifts();
      } else {
        showToast('Failed to delete shift schedule.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting shift schedule.', 'error');
    }
  };

  const formatShiftDateRange = (shift: Shift) => {
    const sDate = toDateInputStr(shift.startTime || shift.date);
    const eDate = toDateInputStr(shift.endTime || shift.date);
    return sDate === eDate ? sDate : `${sDate} → ${eDate}`;
  };

  const formatShiftTimeRange = (shift: Shift) => {
    const s = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const e = new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${s} - ${e}`;
  };

  const handlePrintSchedules = (itemsToPrint: Shift[], title: string) => {
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;
    const rowsHtml = itemsToPrint
      .map((s) => {
        const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown';
        const roles = s.user?.roles?.map((r) => r.name.replace(/_/g, ' ')).join(', ') || 'Staff';
        return `
          <tr>
            <td><strong>${name}</strong><br/><small>${roles}</small></td>
            <td>${s.department}</td>
            <td>${formatShiftDateRange(s)}</td>
            <td>${formatShiftTimeRange(s)}</td>
            <td>${s.status}</td>
          </tr>
        `;
      })
      .join('');

    printWin.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h2 { margin: 0 0 6px; }
            p { margin: 0 0 16px; color: #555; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background: #f4f4f5; text-transform: uppercase; font-size: 11px; }
          </style>
        </head>
        <body>
          <h2>Kwalee Beach Resort — ${title}</h2>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Department</th>
                <th>Start & End Date</th>
                <th>Shift Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 250);
  };

  const handleDownloadScheduleCSV = (itemsToExport: Shift[], filenamePrefix: string) => {
    const csvRows = itemsToExport.map((s) => ({
      Staff: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown',
      Role: s.user?.roles?.map((r) => r.name).join('; ') || 'Staff',
      Department: s.department,
      StartDate: toDateInputStr(s.startTime || s.date),
      EndDate: toDateInputStr(s.endTime || s.date),
      StartTime: toTimeInputStr(s.startTime),
      EndTime: toTimeInputStr(s.endTime),
      Status: s.status,
    }));
    downloadCSV(csvRows, filenamePrefix);
  };

  return (
    <div className="shifts-container">
      {/* Filter & Stage Schedule Export Toolbar */}
      <div className="shifts-header">
        <div className="shifts-filters">
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="filter-group">
            <label>Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="form-input"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Staff Member</label>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="form-input"
            >
              <option value="ALL">All Registered Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="action-btn"
            onClick={() => handlePrintSchedules(shifts, 'Staff Shift Schedule')}
            disabled={shifts.length === 0}
          >
            🖨 Print All
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => handleDownloadScheduleCSV(shifts, 'staff-shifts-schedule')}
            disabled={shifts.length === 0}
          >
            ⬇ Download CSV
          </button>
          {isManager && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => (isFormOpen ? setIsFormOpen(false) : openCreateForm())}
            >
              {isFormOpen ? 'Cancel' : '+ Schedule Shift'}
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Shift Form */}
      {isFormOpen && (
        <form className="add-shift-form" onSubmit={handleSaveShift}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, color: 'hsl(43, 96%, 56%)' }}>
              {editingShiftId ? 'Edit / Modify Staff Shift Schedule' : 'Create New Staff Shift Schedule'}
            </h4>
          </div>

          <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
            <label>Exact Staff (Registered in System)</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">Select Registered Staff...</option>
              {staff.map((s) => {
                const roleStr = s.roles?.map((r) => r.name.replace(/_/g, ' ')).join(', ');
                return (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} {roleStr ? `(${roleStr})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-group" style={{ flex: 1, minWidth: '180px' }}>
            <label>Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="form-input"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="CUSTOM">Other / Custom Department...</option>
            </select>
          </div>

          {department === 'CUSTOM' && (
            <div className="filter-group" style={{ flex: 1, minWidth: '160px' }}>
              <label>Custom Department</label>
              <input
                type="text"
                placeholder="Enter department"
                value={customDepartment}
                onChange={(e) => setCustomDepartment(e.target.value)}
                required
                className="form-input"
              />
            </div>
          )}

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
              required
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label>Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label>End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="filter-group">
            <label>Stage / Status</label>
            <select
              value={shiftStatus}
              onChange={(e) => setShiftStatus(e.target.value)}
              className="form-input"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active / In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
            <label style={{ visibility: 'hidden' }}>Save</label>
            <button type="submit" className="btn-primary">
              {editingShiftId ? 'Update Shift' : 'Save Shift Schedule'}
            </button>
          </div>
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
                <th>Start & End Date</th>
                <th>Shift Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No shifts scheduled for the selected date range.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => {
                  const staffName = shift.user
                    ? `${shift.user.firstName} ${shift.user.lastName}`
                    : 'Unknown';
                  const roleNames = shift.user?.roles
                    ?.map((r) => r.name.replace(/_/g, ' '))
                    .join(', ');
                  return (
                    <tr key={shift.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{staffName}</div>
                        {roleNames && (
                          <div style={{ fontSize: '0.72rem', color: 'hsl(215, 20%, 60%)' }}>
                            {roleNames}
                          </div>
                        )}
                      </td>
                      <td>{shift.department}</td>
                      <td>{formatShiftDateRange(shift)}</td>
                      <td>{formatShiftTimeRange(shift)}</td>
                      <td>
                        <span className={`status-badge ${(shift.status || 'scheduled').toLowerCase()}`}>
                          {shift.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {isManager && (
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => openEditForm(shift)}
                              title="Edit / Modify Shift"
                            >
                              ✎ Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() =>
                              handlePrintSchedules([shift], `Shift Schedule - ${staffName}`)
                            }
                            title="Print this Shift Schedule"
                          >
                            🖨 Print
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() =>
                              handleDownloadScheduleCSV(
                                [shift],
                                `shift-${staffName.replace(/\s+/g, '-').toLowerCase()}`,
                              )
                            }
                            title="Download this Shift Schedule (CSV)"
                          >
                            ⬇ Download
                          </button>
                          {isManager && (
                            <button
                              type="button"
                              className="action-btn"
                              style={{
                                borderColor: 'rgba(239, 68, 68, 0.35)',
                                color: '#f87171',
                              }}
                              onClick={() => handleDeleteShift(shift)}
                              title="Delete Shift Schedule"
                            >
                              🗑 Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .shifts-container { display: flex; flex-direction: column; gap: 16px; }
        .shifts-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 16%); padding: 16px; border-radius: 10px; }
        .shifts-filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
        .filter-group { display: flex; flex-direction: column; gap: 6px; }
        .filter-group label { font-size: 0.72rem; color: hsl(215, 20%, 65%); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .form-input { padding: 8px 12px; border-radius: 6px; border: 1px solid hsl(217, 20%, 18%); background: hsl(220, 30%, 5%); color: hsl(210, 40%, 96%); font-size: 0.85rem; }
        .add-shift-form { display: flex; gap: 12px; padding: 16px; background: hsl(222, 35%, 7%); border: 1px solid hsl(43, 96%, 56%, 0.45); border-radius: 10px; flex-wrap: wrap; align-items: flex-end; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; }
        .status-badge.scheduled { background: hsl(215, 20%, 25%); color: hsl(210, 40%, 96%); }
        .status-badge.active { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .status-badge.completed { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      `}</style>
    </div>
  );
}
