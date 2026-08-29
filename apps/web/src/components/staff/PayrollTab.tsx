import React, { useState, useEffect } from 'react';

type User = {
  id: string;
  firstName: string;
  lastName: string;
};

type Payslip = {
  id: string;
  userId: string;
  user?: User;
  periodStart: string;
  periodEnd: string;
  totalHours: string;
  basePay: string;
  overtimePay: string;
  deductions: string;
  netPay: string;
  status: string;
};

export function PayrollTab({ staff }: { staff: User[] }) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // New Payslip State
  const [userId, setUserId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [basePay, setBasePay] = useState('');
  const [overtimePay, setOvertimePay] = useState('');
  const [taxRate, setTaxRate] = useState('');

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/staff/payroll');
      if (res.ok) {
        const json = await res.json();
        setPayslips(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/staff/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          periodStart,
          periodEnd,
          basePay: Number(basePay),
          overtimePay: Number(overtimePay),
          taxRate: Number(taxRate)
        })
      });
      if (res.ok) {
        setIsGenerating(false);
        fetchPayslips();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/staff/payroll/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchPayslips();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <h3>Payslips</h3>
        <button className="btn-primary" onClick={() => setIsGenerating(!isGenerating)}>
          {isGenerating ? 'Cancel' : '+ Generate Payslip'}
        </button>
      </div>

      {isGenerating && (
        <form className="generate-form" onSubmit={handleGenerate}>
          <select value={userId} onChange={e => setUserId(e.target.value)} required className="form-input">
            <option value="">Select Staff</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Base Pay ($)</label>
            <input type="number" placeholder="Base Pay" value={basePay} onChange={e => setBasePay(e.target.value)} required className="form-input" />
          </div>
          <div className="form-group">
            <label>Overtime ($)</label>
            <input type="number" placeholder="Overtime" value={overtimePay} onChange={e => setOvertimePay(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label>Tax (%)</label>
            <input type="number" placeholder="Tax %" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="form-input" />
          </div>
          <button type="submit" className="btn-primary" style={{ marginBottom: '4px' }}>Generate</button>
        </form>
      )}

      {loading ? (
        <div className="loading-state">Loading payroll...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Period</th>
                <th>Base Pay</th>
                <th>Overtime</th>
                <th>Tax Deducted</th>
                <th>Net Pay</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">No payslips generated yet.</td>
                </tr>
              ) : (
                payslips.map(ps => (
                  <tr key={ps.id}>
                    <td>{ps.user ? `${ps.user.firstName} ${ps.user.lastName}` : 'Unknown'}</td>
                    <td>{new Date(ps.periodStart).toLocaleDateString()} - {new Date(ps.periodEnd).toLocaleDateString()}</td>
                    <td>${ps.basePay}</td>
                    <td>${ps.overtimePay}</td>
                    <td className="text-danger">-${ps.deductions}</td>
                    <td className="font-medium text-success">${ps.netPay}</td>
                    <td>
                      <span className={`status-badge ${ps.status.toLowerCase()}`}>{ps.status}</span>
                    </td>
                    <td>
                      {ps.status !== 'PAID' && (
                        <button className="action-btn" onClick={() => handleStatusUpdate(ps.id, 'PAID')}>Mark Paid</button>
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
        .payroll-container { display: flex; flex-direction: column; gap: 16px; }
        .payroll-header { display: flex; justify-content: space-between; align-items: center; }
        .generate-form { display: flex; gap: 12px; padding: 16px; background: hsl(222, 35%, 7%); border: 1px solid hsl(217, 20%, 18%); border-radius: 8px; flex-wrap: wrap; align-items: flex-end; }
        .form-group { display: flex; flex-direction: column; gap: 4px; }
        .form-group label { font-size: 0.75rem; color: hsl(215, 20%, 65%); }
        .form-input { padding: 8px 12px; border-radius: 6px; border: 1px solid hsl(217, 20%, 18%); background: hsl(220, 30%, 5%); color: hsl(210, 40%, 96%); }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; }
        .status-badge.draft { background: hsl(215, 20%, 25%); color: hsl(210, 40%, 96%); }
        .status-badge.approved { background: hsl(217, 91%, 60%, 0.15); color: hsl(217, 91%, 60%); }
        .status-badge.paid { background: hsl(142, 76%, 36%, 0.15); color: hsl(142, 76%, 55%); }
        .text-danger { color: hsl(0, 84%, 60%); }
        .text-success { color: hsl(142, 76%, 55%); }
      `}</style>
    </div>
  );
}

