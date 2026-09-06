import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

export function EditPayslipModal({ payslip, onClose, onSaved }: { payslip: any, onClose: () => void, onSaved: () => void }) {
  const [formData, setFormData] = useState({
    basePay: payslip.basePay || 0,
    overtimePay: payslip.overtimePay || 0,
    bonus: payslip.bonus || 0,
    targetDays: payslip.targetDays || 25,
    workedDays: payslip.workedDays || 0,
    extraDays: payslip.extraDays || 0,
    holidayWorkedDays: payslip.holidayWorkedDays || 0,
    leaveDays: payslip.leaveDays || 0,
    sickNoJustifyDays: payslip.sickNoJustifyDays || 0,
    sickJustifyDays: payslip.sickJustifyDays || 0,
    bereavedDays: payslip.bereavedDays || 0,
    maternityPaternityDays: payslip.maternityPaternityDays || 0,
    excusePaidDays: payslip.excusePaidDays || 0,
    excuseNoPayDays: payslip.excuseNoPayDays || 0,
    absentDays: payslip.absentDays || 0,
    advance: payslip.advance || 0,
    penalty: payslip.penalty || 0,
    loanPayback: payslip.loanPayback || 0,
    unionDues: payslip.unionDues || 0,
    nasscorp: payslip.nasscorp || 0,
    withholdingTax: payslip.withholdingTax || 0,
    rateLd: payslip.rateLd || 199.86,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/staff/payroll/${payslip.id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onSaved();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-4xl rounded bg-[#0f121b] border border-[#1a1f2e] p-6 text-white max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">Edit Payslip: {payslip.user?.firstName} {payslip.user?.lastName}</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4"><h4 className="font-semibold text-blue-400 border-b border-[#1a1f2e] pb-1">Earnings</h4></div>
              
              <div className="flex flex-col"><label className="text-xs text-gray-400">Base Salary ($)</label><input type="number" step="0.01" name="basePay" value={formData.basePay} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Overtime ($)</label><input type="number" step="0.01" name="overtimePay" value={formData.overtimePay} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Bonus ($)</label><input type="number" step="0.01" name="bonus" value={formData.bonus} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">LD Rate</label><input type="number" step="0.01" name="rateLd" value={formData.rateLd} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>

              <div className="col-span-4"><h4 className="font-semibold text-red-400 border-b border-[#1a1f2e] pb-1 mt-2">Deductions</h4></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Advance ($)</label><input type="number" step="0.01" name="advance" value={formData.advance} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Penalty ($)</label><input type="number" step="0.01" name="penalty" value={formData.penalty} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Loan Pay Back ($)</label><input type="number" step="0.01" name="loanPayback" value={formData.loanPayback} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Union Dues ($)</label><input type="number" step="0.01" name="unionDues" value={formData.unionDues} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Nasscorp ($)</label><input type="number" step="0.01" name="nasscorp" value={formData.nasscorp} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Withholding Tax ($)</label><input type="number" step="0.01" name="withholdingTax" value={formData.withholdingTax} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              
              <div className="col-span-4"><h4 className="font-semibold text-green-400 border-b border-[#1a1f2e] pb-1 mt-2">Attendance & Days</h4></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Target Days</label><input type="number" name="targetDays" value={formData.targetDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Worked Days</label><input type="number" name="workedDays" value={formData.workedDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Extra Days</label><input type="number" name="extraDays" value={formData.extraDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Absent Days</label><input type="number" name="absentDays" value={formData.absentDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Holiday Worked</label><input type="number" name="holidayWorkedDays" value={formData.holidayWorkedDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Leave Days</label><input type="number" name="leaveDays" value={formData.leaveDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Sick (Justified)</label><input type="number" name="sickJustifyDays" value={formData.sickJustifyDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Sick (No Justify)</label><input type="number" name="sickNoJustifyDays" value={formData.sickNoJustifyDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Bereaved Days</label><input type="number" name="bereavedDays" value={formData.bereavedDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Maternity/Paternity</label><input type="number" name="maternityPaternityDays" value={formData.maternityPaternityDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Excuse (Paid)</label><input type="number" name="excusePaidDays" value={formData.excusePaidDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
              <div className="flex flex-col"><label className="text-xs text-gray-400">Excuse (No Pay)</label><input type="number" name="excuseNoPayDays" value={formData.excuseNoPayDays} onChange={handleChange} className="bg-[#141824] border border-[#1a1f2e] p-2 rounded outline-none" /></div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-[#1a1f2e] pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-[#1a1f2e] hover:bg-[#1a1f2e]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium">Save Payslip</button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
