import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast-provider';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  roles?: { id: string; name: string }[];
};

type AttendanceSession = {
  clockIn: string;
  clockOut?: string | null;
  actionType?: string;
};

type AttendancePendingRequest = {
  type: string;
  requestedAt: string;
  time: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
};

type Attendance = {
  id: string;
  userId: string;
  user?: User;
  date: string;
  clockIn: string;
  clockOut?: string | null;
  status: string;
  notes?: string;
  totalWorkedHours?: number;
  regularHours?: number;
  extraTimeHours?: number;
  meta?: {
    sessions?: AttendanceSession[];
    currentAction?: string;
    actionHistory?: Array<{
      type: string;
      time: string;
      reason?: string;
      approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
      approvedBy?: string;
    }>;
    pendingRequest?: AttendancePendingRequest | null;
    noteText?: string;
  };
};

const getCurrentTimeHHMM = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const ACTION_LABELS: Record<string, string> = {
  CLOCK_IN: 'Clock In',
  FROM_BREAK: 'From Break (Resume Work)',
  BREAK: 'Break (Temporary Clock Out)',
  EMERGENCY: 'Emergency',
  LEAVE_WITHOUT_EXCUSE: 'Leave without Excuse',
  LEAVE_WITH_EXCUSE: 'Leave with Excuse',
  CLOCK_OUT: 'Clock Out (Complete Shift)',
};

const APPROVAL_REQUIRED_TYPES = [
  'FROM_BREAK',
  'EMERGENCY',
  'LEAVE_WITHOUT_EXCUSE',
  'LEAVE_WITH_EXCUSE',
];

export function AttendanceTab({
  staff,
  isManager,
  currentUser,
}: {
  staff: User[];
  isManager?: boolean;
  currentUser?: any;
}) {
  const { showToast } = useToast();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);

  const [clockInUserId, setClockInUserId] = useState<string>(currentUser?.id || '');
  const [selectedAction, setSelectedAction] = useState<string>('CLOCK_IN');
  const [actionTime, setActionTime] = useState<string>(getCurrentTimeHHMM);
  const [actionReason, setActionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Per-row quick action states
  const [rowActionMap, setRowActionMap] = useState<Record<string, string>>({});
  const [rowTimeMap, setRowTimeMap] = useState<Record<string, string>>({});
  const [rowReasonMap, setRowReasonMap] = useState<Record<string, string>>({});

  const canApprove = Boolean(
    isManager ||
      currentUser?.roles?.some((r: any) =>
        ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR'].includes(
          (typeof r === 'string' ? r : r?.name || '').toUpperCase(),
        ),
      ),
  );

  // Keep default time updated to current time of day every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const currentHHMM = getCurrentTimeHHMM();
      setActionTime(currentHHMM);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!clockInUserId && currentUser?.id) {
      setClockInUserId(currentUser.id);
    }
  }, [currentUser?.id]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/staff/attendance?date=${dateStr}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const rows: Attendance[] = json.data || json || [];
        setAttendances(rows);
        const nowHHMM = getCurrentTimeHHMM();
        const nextRowTimes: Record<string, string> = {};
        const nextRowActions: Record<string, string> = {};
        rows.forEach((r) => {
          nextRowTimes[r.id] = rowTimeMap[r.id] || nowHHMM;
          const isPaused =
            r.status === 'ON_BREAK' ||
            r.status === 'EMERGENCY' ||
            r.meta?.currentAction === 'BREAK' ||
            r.meta?.currentAction === 'EMERGENCY';
          nextRowActions[r.id] =
            rowActionMap[r.id] || (isPaused ? 'FROM_BREAK' : 'CLOCK_OUT');
        });
        setRowTimeMap(nextRowTimes);
        setRowActionMap(nextRowActions);
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

  const handleTopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = isManager ? clockInUserId || currentUser?.id : currentUser?.id;
    if (!targetUserId) {
      showToast('Please select a staff member first.', 'error');
      return;
    }

    const needsApproval = APPROVAL_REQUIRED_TYPES.includes(selectedAction);
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/staff/attendance/clock-in', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          date: dateStr,
          clockInTime: actionTime || getCurrentTimeHHMM(),
          actionType: selectedAction,
          notes: actionReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        if (needsApproval && !canApprove) {
          showToast(
            `${ACTION_LABELS[selectedAction] || selectedAction} recorded & sent for Supervisor / Manager / CEO / Admin approval.`,
            'info',
            'Request Submitted',
          );
        } else {
          showToast(
            `${ACTION_LABELS[selectedAction] || selectedAction} recorded successfully!`,
            'success',
            'Attendance Updated',
          );
        }
        setActionReason('');
        setActionTime(getCurrentTimeHHMM());
        fetchAttendance();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to record attendance action', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error recording attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowAction = async (
    record: Attendance,
    overrideAction?: string,
  ) => {
    const chosenAction = overrideAction || rowActionMap[record.id] || 'CLOCK_OUT';
    const chosenTime = rowTimeMap[record.id] || getCurrentTimeHHMM();
    const chosenReason = rowReasonMap[record.id] || '';
    const needsApproval = APPROVAL_REQUIRED_TYPES.includes(chosenAction);

    try {
      const res = await fetch(`/api/v1/staff/attendance/${record.id}/clock-out`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: chosenAction,
          clockOutTime: chosenTime,
          notes: chosenReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        if (needsApproval && !canApprove) {
          showToast(
            `${ACTION_LABELS[chosenAction] || chosenAction} requested — awaiting Supervisor / Manager / CEO / Admin approval.`,
            'info',
            'Approval Requested',
          );
        } else {
          showToast(
            `${ACTION_LABELS[chosenAction] || chosenAction} saved!`,
            'success',
            'Attendance Updated',
          );
        }
        setRowReasonMap((prev) => ({ ...prev, [record.id]: '' }));
        fetchAttendance();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to update attendance', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update attendance', 'error');
    }
  };

  const handleApproveRequest = async (id: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/v1/staff/attendance/${id}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        showToast(
          approved ? 'Attendance request approved!' : 'Attendance request rejected.',
          approved ? 'success' : 'info',
        );
        fetchAttendance();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to process approval', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to process approval', 'error');
    }
  };

  const requiresApprovalNote = APPROVAL_REQUIRED_TYPES.includes(selectedAction);

  return (
    <div className="attendance-container">
      {/* Top Quick Clock-In & Job Status Action Bar */}
      <div className="attendance-card">
        <div className="attendance-card-header">
          <div>
            <h3 style={{ margin: 0, color: 'hsl(210, 40%, 96%)', fontSize: '1rem' }}>
              Daily Clock-In / Clock-Out & Break / Leave Control
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'hsl(215, 20%, 60%)' }}>
              Standard shift: <strong>8 hours/day</strong>. Additional hours worked beyond 8 hours are counted as{' '}
              <strong style={{ color: 'hsl(43, 96%, 56%)' }}>Extra Time</strong> (minimum 1 full hour of extra time/day).
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.78rem', color: 'hsl(215, 20%, 65%)' }}>Date:</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <form className="clock-in-form" onSubmit={handleTopSubmit}>
          {isManager ? (
            <div className="field-group">
              <label>Staff Member</label>
              <select
                value={clockInUserId}
                onChange={(e) => setClockInUserId(e.target.value)}
                required
                className="form-input"
              >
                <option value="">Select Staff Member...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field-group">
              <label>Staff Member</label>
              <input
                type="text"
                disabled
                value={`${currentUser?.firstName || 'Me'} ${currentUser?.lastName || ''}`.trim()}
                className="form-input"
              />
            </div>
          )}

          <div className="field-group">
            <label>Clocking / Job Option</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="form-input"
            >
              <option value="CLOCK_IN">Clock In</option>
              <option value="FROM_BREAK">From Break (Return to Work - Req. Access)</option>
              <option value="BREAK">Break (Temporary Clock Out)</option>
              <option value="EMERGENCY">Emergency (Req. Supervisor/Manager Access)</option>
              <option value="LEAVE_WITHOUT_EXCUSE">Leave without Excuse (Req. Access)</option>
              <option value="LEAVE_WITH_EXCUSE">Leave with Excuse (Req. Access)</option>
              <option value="CLOCK_OUT">Clock Out</option>
            </select>
          </div>

          <div className="field-group">
            <label>Default Time (Time of Day)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="time"
                value={actionTime}
                onChange={(e) => setActionTime(e.target.value)}
                required
                className="form-input"
              />
              <button
                type="button"
                className="action-btn"
                onClick={() => setActionTime(getCurrentTimeHHMM())}
                title="Reset to current time of day"
              >
                Now
              </button>
            </div>
          </div>

          <div className="field-group" style={{ flex: 1, minWidth: '180px' }}>
            <label>
              {requiresApprovalNote
                ? 'Reason / Note (For Supervisor, Manager, CEO or Admin)'
                : 'Optional Note'}
            </label>
            <input
              type="text"
              placeholder={
                requiresApprovalNote
                  ? 'Enter reason for approval request...'
                  : 'Optional shift note...'
              }
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="field-group" style={{ justifyContent: 'flex-end' }}>
            <label style={{ visibility: 'hidden' }}>Action</label>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting
                ? 'Saving...'
                : requiresApprovalNote && !canApprove
                  ? `Request ${ACTION_LABELS[selectedAction]?.split(' (')[0]}`
                  : `${ACTION_LABELS[selectedAction]?.split(' (')[0] || 'Clock In'} Now`}
            </button>
          </div>
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
                <th>Worked / Extra Time</th>
                <th>Status & Access Approval</th>
                <th>Quick Clock Out / Return Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No attendance records for this date.
                  </td>
                </tr>
              ) : (
                attendances.map((record) => {
                  const sessions = record.meta?.sessions || [];
                  const workedHrs = Number(record.totalWorkedHours || 0);
                  const regHrs = Number(record.regularHours || 0);
                  const extraHrs = Number(record.extraTimeHours || 0);
                  const pendingReq = record.meta?.pendingRequest;
                  const canResume =
                    record.status === 'ON_BREAK' ||
                    record.status === 'EMERGENCY' ||
                    record.meta?.currentAction === 'BREAK' ||
                    record.meta?.currentAction === 'EMERGENCY' ||
                    Boolean(record.clockOut);

                  const rowTime = rowTimeMap[record.id] || getCurrentTimeHHMM();
                  const rowAction = rowActionMap[record.id] || (canResume ? 'FROM_BREAK' : 'CLOCK_OUT');

                  return (
                    <tr key={record.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown'}
                        </div>
                        {sessions.length > 1 && (
                          <div style={{ fontSize: '0.72rem', color: 'hsl(215, 20%, 60%)', marginTop: '2px' }}>
                            {sessions.length} work sessions today
                          </div>
                        )}
                      </td>

                      <td>
                        <div>{new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        {sessions.length > 1 && (
                          <div style={{ fontSize: '0.72rem', color: 'hsl(142, 76%, 55%)', marginTop: '2px' }}>
                            Returned: {new Date(sessions[sessions.length - 1].clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      <td>
                        {record.clockOut ? (
                          new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        ) : record.status === 'ON_BREAK' ? (
                          <span style={{ color: 'hsl(43, 96%, 56%)', fontSize: '0.8rem', fontWeight: 600 }}>
                            On Break (Paused)
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'hsl(210, 40%, 96%)' }}>
                            {workedHrs.toFixed(2)} hrs total ({regHrs.toFixed(2)}h regular)
                          </span>
                          {extraHrs >= 1 ? (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 'fit-content',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(245, 158, 11, 0.18)',
                                color: 'hsl(43, 96%, 56%)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                              }}
                            >
                              +{extraHrs.toFixed(2)} hrs Extra Time
                            </span>
                          ) : workedHrs > 8 ? (
                            <span style={{ fontSize: '0.72rem', color: 'hsl(215, 20%, 55%)' }}>
                              Extra time &lt; 1h (not counted)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'hsl(215, 20%, 50%)' }}>
                              No extra time
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span className={`status-badge ${record.status.toLowerCase()}`}>
                            {record.status.replace(/_/g, ' ')}
                          </span>

                          {pendingReq && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background:
                                  pendingReq.status === 'APPROVED'
                                    ? 'rgba(34, 197, 94, 0.12)'
                                    : pendingReq.status === 'REJECTED'
                                      ? 'rgba(239, 68, 68, 0.12)'
                                      : 'rgba(245, 158, 11, 0.15)',
                                border:
                                  pendingReq.status === 'APPROVED'
                                    ? '1px solid rgba(34, 197, 94, 0.3)'
                                    : pendingReq.status === 'REJECTED'
                                      ? '1px solid rgba(239, 68, 68, 0.3)'
                                      : '1px solid rgba(245, 158, 11, 0.4)',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: 'hsl(210, 40%, 96%)' }}>
                                {pendingReq.type.replace(/_/g, ' ')} • {pendingReq.status}
                              </div>
                              {pendingReq.reason && (
                                <div style={{ color: 'hsl(215, 20%, 70%)', marginTop: '2px' }}>
                                  Note: {pendingReq.reason}
                                </div>
                              )}
                              {pendingReq.approvedBy && (
                                <div style={{ color: 'hsl(142, 76%, 55%)', marginTop: '2px' }}>
                                  By: {pendingReq.approvedBy}
                                </div>
                              )}
                              {pendingReq.status === 'PENDING' && canApprove && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveRequest(record.id, true)}
                                    style={{
                                      background: '#16a34a',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '3px 8px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveRequest(record.id, false)}
                                    style={{
                                      background: '#dc2626',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '3px 8px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '250px' }}>
                          {canResume && (
                            <button
                              type="button"
                              className="btn-resume"
                              onClick={() => handleRowAction(record, 'FROM_BREAK')}
                            >
                              ↻ Clock In (From Break / Resume Daily Work)
                            </button>
                          )}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select
                              value={rowAction}
                              onChange={(e) =>
                                setRowActionMap((prev) => ({ ...prev, [record.id]: e.target.value }))
                              }
                              className="form-input"
                              style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                            >
                              <option value="CLOCK_OUT">Clock Out</option>
                              <option value="BREAK">Break (Pause)</option>
                              <option value="FROM_BREAK">From Break (Resume)</option>
                              <option value="EMERGENCY">Emergency</option>
                              <option value="LEAVE_WITHOUT_EXCUSE">Leave without Excuse</option>
                              <option value="LEAVE_WITH_EXCUSE">Leave with Excuse</option>
                            </select>
                            <input
                              type="time"
                              value={rowTime}
                              onChange={(e) =>
                                setRowTimeMap((prev) => ({ ...prev, [record.id]: e.target.value }))
                              }
                              className="form-input"
                              style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                              title="Default clock-out / action time"
                            />
                            <button
                              type="button"
                              className="action-btn"
                              onClick={() => handleRowAction(record)}
                              style={{
                                background: 'hsl(43, 96%, 56%, 0.15)',
                                borderColor: 'hsl(43, 96%, 56%, 0.4)',
                                color: 'hsl(43, 96%, 56%)',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                              }}
                            >
                              Apply
                            </button>
                          </div>
                          {APPROVAL_REQUIRED_TYPES.includes(rowAction) && (
                            <input
                              type="text"
                              placeholder="Reason for Supervisor/Manager approval..."
                              value={rowReasonMap[record.id] || ''}
                              onChange={(e) =>
                                setRowReasonMap((prev) => ({ ...prev, [record.id]: e.target.value }))
                              }
                              className="form-input"
                              style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                            />
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
        .attendance-container { display: flex; flex-direction: column; gap: 16px; }
        .attendance-card { background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 16%); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        .attendance-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
        .clock-in-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-group label { font-size: 0.75rem; color: hsl(215, 20%, 65%); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .form-input { padding: 8px 12px; border-radius: 6px; border: 1px solid hsl(217, 20%, 18%); background: hsl(220, 30%, 5%); color: hsl(210, 40%, 96%); font-size: 0.85rem; }
        .btn-resume { background: rgba(34, 197, 94, 0.16); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80; padding: 6px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 700; cursor: pointer; text-align: left; transition: all 0.2s; }
        .btn-resume:hover { background: rgba(34, 197, 94, 0.25); }
        .status-badge { display: inline-block; width: fit-content; padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; }
        .status-badge.present, .status-badge.from_break { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
        .status-badge.on_break, .status-badge.late { background: hsl(43, 96%, 56%, 0.15); color: hsl(43, 96%, 56%); }
        .status-badge.emergency, .status-badge.absent, .status-badge.leave_without_excuse { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 65%); }
        .status-badge.leave_with_excuse { background: rgba(59, 130, 246, 0.18); color: #60a5fa; }
      `}</style>
    </div>
  );
}
