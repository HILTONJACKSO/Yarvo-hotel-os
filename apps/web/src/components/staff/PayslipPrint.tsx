import React from 'react';

export function PayslipPrint({ payslip }: { payslip: any }) {
  if (!payslip) return null;

  const date = new Date(payslip.periodEnd);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const yearMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="print-payslip" style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>KWAALEE BEACH RESORT</h1>
        <p style={{ margin: '0', fontSize: '12px' }}>www.kwaleebeachresort.com</p>
        <p style={{ margin: '0', fontSize: '12px' }}>+231 774 340 843 / +231 881 774 350</p>
        <p style={{ margin: '0', fontSize: '12px', marginBottom: '10px' }}>Kpakpa Kon, Marshall, Lower Margibi County, Liberia</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '10px 0', marginTop: '10px' }}>
          <div><strong>Period:</strong> {yearMonth}</div>
          <div><strong>Payslip #:</strong> {payslip.id.split('-')[0].toUpperCase()}</div>
          <div><strong>LD Rate:</strong> ${payslip.rateLd}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        {/* Employee Details & Earnings */}
        <div style={{ flex: 1 }}>
          <h3 style={{ borderBottom: '1px solid #ccc' }}>Employee Details</h3>
          <p><strong>Name:</strong> {payslip.user?.firstName} {payslip.user?.lastName}</p>
          {payslip.user?.roles && <p><strong>Role:</strong> {payslip.user.roles.map((r:any) => r.name).join(', ')}</p>}

          <h3 style={{ borderBottom: '1px solid #ccc', marginTop: '20px' }}>Earnings</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base Salary</span><span>${Number(payslip.basePay).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bonus</span><span>${Number(payslip.bonus).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Overtime</span><span>${Number(payslip.overtimePay).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px' }}><span>Gross Salary</span><span>${Number(payslip.grossSalary).toFixed(2)}</span></div>

          <h3 style={{ borderBottom: '1px solid #ccc', marginTop: '20px' }}>Deductions</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Advance</span><span>${Number(payslip.advance).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Penalty</span><span>${Number(payslip.penalty).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Loan Payback</span><span>${Number(payslip.loanPayback).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Union Dues</span><span>${Number(payslip.unionDues).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Social Security (Nasscorp)</span><span>${Number(payslip.nasscorp).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Income Tax (Withholding)</span><span>${Number(payslip.withholdingTax).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', color: 'red' }}><span>Total Deductions</span><span>${Number(payslip.deductions).toFixed(2)}</span></div>
        </div>

        {/* Attendance */}
        <div style={{ width: '250px' }}>
          <h3 style={{ borderBottom: '1px solid #ccc' }}>Attendance</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Targets</span><span>{payslip.targetDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Worked</span><span>{payslip.workedDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Extra Days</span><span>{payslip.extraDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Holiday Worked</span><span>{payslip.holidayWorkedDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Leave</span><span>{payslip.leaveDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sick (No Justify)</span><span>{payslip.sickNoJustifyDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sick (Justify)</span><span>{payslip.sickJustifyDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bereaved</span><span>{payslip.bereavedDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Maternity/Pat.</span><span>{payslip.maternityPaternityDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Excuse (Paid)</span><span>{payslip.excusePaidDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Excuse (No Pay)</span><span>{payslip.excuseNoPayDays}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Absent</span><span>{payslip.absentDays}</span></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', background: '#eee', padding: '4px' }}>
            <span>Attendance %</span><span>{Number(payslip.attendancePercent).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', padding: '20px', border: '2px solid black', fontSize: '20px', fontWeight: 'bold', background: '#f5f5f5' }}>
        <span>NET PAY (BALANCE SALARY): </span>
        <span style={{ marginLeft: '10px', color: 'green' }}>${Number(payslip.netPay).toFixed(2)}</span>
      </div>

    </div>
  );
}
