import React from 'react';

export function PayrollSummaryPrint({ summary, periodStart }: { summary: any, periodStart: string }) {
  if (!summary) return null;

  const date = new Date(periodStart);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const yearMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="print-payslip" style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>KWAALEE BEACH RESORT</h1>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '18px' }}>Payroll Summary Report</h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Period: {yearMonth}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <tbody>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc' }} colSpan={2}>Earnings Summary</th>
          </tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Base Salary</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalSalary).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Gross Wages</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>${Number(summary.totalGrossWages).toFixed(2)}</td></tr>
          
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc', paddingTop: '20px' }} colSpan={2}>Deductions Summary</th>
          </tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Advance</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalAdvance).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Penalty</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalPenalty).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Loan Payback</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalLoanPayback).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Union Dues</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalUnion).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Nasscorp</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalNasscorp).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Withholding Tax</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>${Number(summary.totalWithholding).toFixed(2)}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee', color: 'red' }}>Total Deductions</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right', color: 'red', fontWeight: 'bold' }}>${Number(summary.totalDeductions).toFixed(2)}</td></tr>

          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ccc', paddingTop: '20px' }} colSpan={2}>Attendance Summary</th>
          </tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Days Worked</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{summary.totalDaysWork}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Extra Days</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{summary.totalExtraDays}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Absent</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{summary.totalAbsent}</td></tr>
          <tr><td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Total Work Holiday</td><td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{summary.totalWorkHoliday}</td></tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '20px', border: '2px solid black', fontSize: '20px', fontWeight: 'bold', background: '#f5f5f5' }}>
        <span>TOTAL BALANCE SALARY (NET PAY): </span>
        <span style={{ color: 'green' }}>${Number(summary.totalBalance).toFixed(2)}</span>
      </div>
    </div>
  );
}
