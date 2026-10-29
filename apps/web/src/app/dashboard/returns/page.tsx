'use client';

import { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { useToast } from '@/components/ui/toast-provider';
import { useCurrency } from '@/lib/currency';
import ReportExportToolbar from '@/components/ReportExportToolbar';
import { downloadCSV } from '@/utils/export';
const API_URL = '';

type PosReturnRequest = {
  id: string;
  orderItem: {
    quantity: number;
    menuItem: { name: string; price: string };
    order: {
      table: { number: string } | null;
    }
  };
  requestedBy: { firstName: string; lastName: string };
  confirmedBy?: { firstName: string; lastName: string } | null;
  approvedBy?: { firstName: string; lastName: string } | null;
  kitchenNote?: string;
  status: string;
  createdAt: string;
};

export default function ReturnsPage() {
  const { format } = useCurrency();
  const { showToast } = useToast();
  const [returns, setReturns] = useState<PosReturnRequest[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'RETURNS' | 'DISCOUNTS'>('RETURNS');

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const fetchReturns = useCallback(() => {
    let query = '';
    if (dateRange.start && dateRange.end) {
      query = `?start=${dateRange.start}&end=${dateRange.end}`;
    }
    fetch(`/api/v1/pos/returns${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || []);
        setReturns(list);
      })
      .catch(console.error);

    fetch(`/api/v1/analytics/discounts${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || []);
        setDiscounts(list);
      })
      .catch(console.error);
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchReturns();
    const interval = setInterval(() => fetchReturns(), 5000);
    return () => clearInterval(interval);
  }, [fetchReturns]);

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
    } else if (format === 'pdf') {
      const element = document.querySelector('.returns-layout') as HTMLElement;
      if (!element) {
        showToast('Could not generate PDF', 'error');
        return;
      }
      
      try {
        const filter = (node: any) => { return !node.classList?.contains('no-print'); };
          const scale = 2;
          const imgData = await domtoimage.toPng(element, {
            filter: filter,
            bgcolor: '#0a0d14',
            width: element.clientWidth * scale,
            height: element.clientHeight * scale,
            style: {
              transform: 'scale('+scale+')',
              transformOrigin: 'top left'
            }
          });
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (element.clientHeight * pdfWidth) / element.clientWidth;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Returns-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (err) {
        console.error('PDF Error:', err);
        showToast('Failed to generate PDF', 'error');
      }
    } else if (format === 'csv') {
      downloadCSV(returns.map(r => ({
        date: r.createdAt,
        status: r.status,
        item: r.orderItem.menuItem.name,
        quantity: r.orderItem.quantity,
        price: r.orderItem.menuItem.price,
        table: r.orderItem.order.table?.number || 'Takeout',
        requestedBy: `${r.requestedBy.firstName} ${r.requestedBy.lastName}`,
        kitchenNote: r.kitchenNote || ''
      })), 'returns-report');
    }
  };

  const handleApprove = async (returnId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/v1/pos/returns/${returnId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved })
      });
      if (!res.ok) throw new Error("Failed to process");
      showToast(`Return request ${approved ? 'approved' : 'rejected'}`, 'success', 'Success');
      fetchReturns();
    } catch (err) {
      showToast('Failed to process return request', 'error');
    }
  };

  return (
    <div className="returns-layout">
      <div className="header">
        <h2>Returns & Discounts Dashboard</h2>
        <p className="subtitle">Track return requests and monitor applied discounts across Folios and POS orders.</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        {(!dateRange.start && !dateRange.end) ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-950/30 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs text-emerald-300 gap-2 mb-4">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="font-semibold text-emerald-300">Auto Mode Active:</span>
              <span>All discounts and returns across days are automatically preserved and live-aggregated.</span>
            </div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold self-start sm:self-auto shrink-0">Continuous Tracking</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-cyan-950/30 border border-cyan-500/30 px-4 py-2.5 rounded-xl text-xs text-cyan-300 gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
              <span className="font-semibold text-cyan-300">Filtered Date Range:</span>
              <span>Showing records from <strong className="text-white">{dateRange.start}</strong> to <strong className="text-white">{dateRange.end}</strong></span>
            </div>
            <button 
              onClick={() => handleDateChange('', '')}
              className="text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 px-2.5 py-1 rounded-lg border border-cyan-500/40 font-semibold transition-colors self-start sm:self-auto shrink-0"
            >
              Reset to Auto (All Days)
            </button>
          </div>
        )}
        <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} initialStartDate={dateRange.start} initialEndDate={dateRange.end} initialPreset="auto" />
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-700">
        <button onClick={() => setActiveTab('RETURNS')} className={`pb-3 px-4 font-bold flex items-center gap-2 ${activeTab === 'RETURNS' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>
          Returns
          {returns.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_CONFIRMATION' || r.status === 'RETURN_REQUESTED').length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-rose-500 text-white rounded-full font-bold animate-pulse">
              {returns.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'PENDING_CONFIRMATION' || r.status === 'RETURN_REQUESTED').length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('DISCOUNTS')} className={`pb-3 px-4 font-bold ${activeTab === 'DISCOUNTS' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Discounts</button>
      </div>

      {activeTab === 'RETURNS' && (
        <div className="returns-grid">
          {returns.length === 0 && <p className="no-data">No return requests found.</p>}
        {returns.map(req => {
          const isPending = req.status === 'PENDING_APPROVAL' || req.status === 'PENDING_CONFIRMATION' || req.status === 'RETURN_REQUESTED';
          return (
          <div key={req.id} className="return-card">
            <div className="r-header">
              <span className={`status-badge status-${req.status.toLowerCase()}`}>
                {req.status.replace('_', ' ')}
              </span>
              <span className="r-date">{new Date(req.createdAt).toLocaleString()}</span>
            </div>
            
            <div className="r-body">
              <h3>{req.orderItem.quantity}x {req.orderItem.menuItem.name}</h3>
              <p className="r-price">{format(Number(req.orderItem.menuItem.price))}</p>
              <p><strong>Table:</strong> {req.orderItem.order.table?.number || 'Takeout'}</p>
              <p><strong>Requested By:</strong> {req.requestedBy?.firstName} {req.requestedBy?.lastName}</p>
              
              {req.kitchenNote && (
                <div className="r-note" style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.4)', borderRadius: '6px', padding: '8px 12px', marginTop: '10px' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.85rem' }}>Reason for Return:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem', marginTop: '2px' }}>{req.kitchenNote}</div>
                  {req.confirmedBy && (
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#9ca3af' }}>
                      Confirmed by: {req.confirmedBy.firstName} {req.confirmedBy.lastName}
                    </div>
                  )}
                </div>
              )}

              {req.approvedBy && (
                <p style={{ marginTop: '8px' }}><strong>Manager:</strong> {req.approvedBy.firstName} {req.approvedBy.lastName}</p>
              )}
            </div>

            {isPending && (
              <div className="r-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn-success" style={{ flex: 1 }} onClick={() => handleApprove(req.id, true)}>Approve Return</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleApprove(req.id, false)}>Reject</button>
              </div>
            )}
          </div>
        )})}
      </div>
      )}

      {activeTab === 'DISCOUNTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Total Discounts Given</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {format(discounts.reduce((sum, d) => sum + Number(d.amount || 0), 0))}
              </p>
              <span className="text-xs text-slate-400">{discounts.length} total applied discount records</span>
            </div>
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">POS Restaurant / Bar Discounts</span>
              <p className="text-2xl font-bold text-orange-400 mt-1">
                {format(discounts.filter(d => d.source === 'POS').reduce((sum, d) => sum + Number(d.amount || 0), 0))}
              </p>
              <span className="text-xs text-slate-400">{discounts.filter(d => d.source === 'POS').length} dining & bar orders</span>
            </div>
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 shadow-sm">
              <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Folio Rate Adjustments</span>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {format(discounts.filter(d => d.source === 'FOLIO').reduce((sum, d) => sum + Number(d.amount || 0), 0))}
              </p>
              <span className="text-xs text-slate-400">{discounts.filter(d => d.source === 'FOLIO').length} room folio adjustments</span>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Source</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Reference (Guest/Table)</th>
                <th className="p-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {discounts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No discounts found for this period.</td></tr>
              )}
              {discounts.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-800/50">
                  <td className="p-4">{new Date(d.date).toLocaleString()}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${d.source === 'FOLIO' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{d.source}</span></td>
                  <td className="p-4">{d.description}</td>
                  <td className="p-4">{d.reference}</td>
                  <td className="p-4 text-right font-bold text-amber-400">{format(Number(d.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      <style>{`
        .returns-layout { padding: 24px; }
        .header h2 { margin: 0 0 8px 0; color: white; }
        .subtitle { color: hsl(215, 20%, 65%); margin-bottom: 24px; }
        
        .returns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        .return-card {
          background: hsl(222, 35%, 10%);
          border: 1px solid hsl(217, 20%, 16%);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .r-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid hsl(217, 20%, 16%);
          padding-bottom: 12px;
        }
        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-pending_confirmation { background: hsl(43, 96%, 56%, 0.15); color: hsl(43, 96%, 60%); }
        .status-pending_approval { background: hsl(220, 90%, 56%, 0.15); color: hsl(220, 90%, 60%); }
        .status-approved { background: hsl(142, 76%, 45%, 0.15); color: hsl(142, 76%, 50%); }
        .status-rejected { background: hsl(0, 84%, 60%, 0.15); color: hsl(0, 84%, 60%); }
        
        .r-date { color: hsl(215, 20%, 65%); font-size: 0.85rem; }
        
        .r-body {
          color: hsl(215, 20%, 85%);
          font-size: 0.95rem;
        }
        .r-body h3 {
          margin: 0 0 4px 0;
          color: white;
          font-size: 1.2rem;
        }
        .r-price {
          color: hsl(142, 76%, 50%);
          font-weight: 600;
          margin-bottom: 12px;
        }
        .r-body p { margin: 4px 0; }
        
        .r-note {
          margin-top: 12px;
          background: hsl(43, 96%, 56%, 0.1);
          color: hsl(43, 96%, 60%);
          padding: 12px;
          border-radius: 6px;
        }

        .r-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
          border-top: 1px solid hsl(217, 20%, 16%);
          padding-top: 16px;
        }
        .btn-success {
          flex: 1;
          padding: 10px;
          background: hsl(142, 76%, 40%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-success:hover { background: hsl(142, 76%, 35%); }
        
        .btn-danger {
          flex: 1;
          padding: 10px;
          background: hsl(0, 84%, 40%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-danger:hover { background: hsl(0, 84%, 35%); }
        
        .no-data { color: hsl(215, 20%, 65%); }
      `}</style>
    </div>
  );
}
