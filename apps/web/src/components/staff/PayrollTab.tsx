import React, { useState, useEffect } from 'react';
import { EditPayslipModal } from './EditPayslipModal';
import { PayslipPrint } from './PayslipPrint';
import { PayrollSummaryPrint } from './PayrollSummaryPrint';
import { useAuth } from '@/lib/auth-provider';

export function PayrollTab({ staff }: { staff: any[] }) {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.roles?.some((r: any) => ["SUPER_ADMIN", "ADMIN", "CEO", "MANAGER"].includes(r.name?.toUpperCase() || r.toUpperCase() || r));

  const [payslips, setPayslips] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  
  const [editingPayslip, setEditingPayslip] = useState<any | null>(null);
  
  const [printingPayslip, setPrintingPayslip] = useState<any>(null);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const [psRes, sumRes] = await Promise.all([
        fetch(`/api/v1/staff/payroll?periodStart=${periodStart}&periodEnd=${periodEnd}`),
        fetch(`/api/v1/staff/payroll/summary?periodStart=${periodStart}&periodEnd=${periodEnd}`)
      ]);
      
      if (psRes.ok) {
        const json = await psRes.json();
        setPayslips(json.data || []);
      }
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [periodStart, periodEnd]);

  const handleGenerateAll = async () => {
    if (!confirm('Generate draft payslips for all staff for this period?')) return;
    
    // Auto-generate for everyone who doesn't have one
    const existingUserIds = new Set(payslips.map(ps => ps.userId));
    const missingStaff = staff.filter(s => !existingUserIds.has(s.id));
    
    for (const s of missingStaff) {
      await fetch('/api/v1/staff/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: s.id, periodStart, periodEnd })
      });
    }
    fetchPayroll();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/v1/staff/payroll/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchPayroll();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerPrint = (payslip: any) => {
    setPrintingPayslip(payslip);
    setTimeout(() => {
      window.print();
      setPrintingPayslip(null);
    }, 100);
  };

  const handlePrintSummary = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-[#0f121b] p-4 rounded-lg border border-[#1a1f2e] no-print">
        <div className="flex gap-4 items-center">
          <h3 className="font-bold">Payroll Period</h3>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded text-sm outline-none" />
          <span className="text-gray-500">to</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded text-sm outline-none" />
        </div>
        <div className="flex gap-2">
          {isManagerOrAdmin && (
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium" onClick={handleGenerateAll}>
              Auto-Generate Drafts
            </button>
          )}
          <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium" onClick={handlePrintSummary} disabled={!summary}>
            Print Summary (A4)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 no-print">Loading payroll data...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#1a1f2e] bg-[#0f121b] no-print">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#141824] border-b border-[#1a1f2e] text-gray-400">
              <tr>
                <th className="p-3 font-medium">Staff</th>
                <th className="p-3 font-medium">Gross Salary</th>
                <th className="p-3 font-medium">Deductions</th>
                <th className="p-3 font-medium">Net Pay</th>
                <th className="p-3 font-medium">Attendance</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1f2e]">
              {payslips.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No payslips for this period. Click Auto-Generate Drafts.</td></tr>
              ) : (
                payslips.map(ps => (
                  <tr key={ps.id} className="hover:bg-[#141824]/50">
                    <td className="p-3 font-medium">{ps.user?.firstName} {ps.user?.lastName}</td>
                    <td className="p-3">${Number(ps.grossSalary || 0).toFixed(2)}</td>
                    <td className="p-3 text-red-400">-${Number(ps.deductions || 0).toFixed(2)}</td>
                    <td className="p-3 text-green-400 font-bold">${Number(ps.netPay || 0).toFixed(2)}</td>
                    <td className="p-3">{Number(ps.attendancePercent || 0).toFixed(0)}% ({ps.workedDays}/{ps.targetDays} days)</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ps.status === 'PAID' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                        {ps.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      {isManagerOrAdmin && (
                        <button onClick={() => setEditingPayslip(ps)} className="text-blue-400 hover:text-blue-300">Edit</button>
                      )}
                      <button onClick={() => triggerPrint(ps)} className="text-gray-400 hover:text-white">Print</button>
                      {isManagerOrAdmin && ps.status !== 'PAID' && (
                        <button onClick={() => handleStatusUpdate(ps.id, 'PAID')} className="text-green-400 hover:text-green-300">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingPayslip && (
        <div className="no-print">
          <EditPayslipModal 
            payslip={editingPayslip} 
            onClose={() => setEditingPayslip(null)} 
            onSaved={() => { setEditingPayslip(null); fetchPayroll(); }} 
          />
        </div>
      )}

      {/* Hidden Print Containers */}
      <div className="print-only">
        {printingPayslip && <PayslipPrint payslip={printingPayslip} />}
        {!printingPayslip && summary && <PayrollSummaryPrint summary={summary} periodStart={periodStart} />}
      </div>
      <style>{`
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
