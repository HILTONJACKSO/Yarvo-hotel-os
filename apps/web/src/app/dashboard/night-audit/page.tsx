'use client';

import { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { Moon, History, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import ReportExportToolbar from '@/components/ReportExportToolbar';
import { downloadCSV } from '@/utils/export';
import { useCurrency } from '@/lib/currency';

export default function NightAuditPage() {
  const { format } = useCurrency();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const fetchHistory = useCallback(async (start?: string, end?: string) => {
    try {
      let query = '';
      if (start && end) query = `?start=${start}&end=${end}`;
      const res = await fetch(`/api/v1/night-audit/history${query}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDateChange = (start: string, end: string) => {
    fetchHistory(start, end);
  };

  const handleExport = async (exportFormat: 'pdf' | 'csv' | 'print') => {
    if (exportFormat === 'print') {
      window.print();
    } else if (exportFormat === 'pdf') {
      const element = document.querySelector('.page-container') as HTMLElement;
      if (!element) return;
      
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
        orientation: 'l',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.clientHeight * pdfWidth) / element.clientWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Night-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } else if (exportFormat === 'csv') {
      downloadCSV(history.map(a => ({
        date: a.auditDate,
        status: a.status,
        roomRevenue: Number(a.totalRoomRevenue || 0).toFixed(2),
        fbRevenue: Number(a.totalFbRevenue || 0).toFixed(2),
        boutiqueRevenue: Number(a.totalBoutiqueRevenue || 0).toFixed(2),
        entryTicketRevenue: Number(a.totalEntryTicketRevenue || 0).toFixed(2),
        poolTicketRevenue: Number(a.totalPoolTicketRevenue || 0).toFixed(2),
        eventsRevenue: Number(a.totalEventsRevenue || 0).toFixed(2),
        activitiesToursPackagesRevenue: Number(a.totalActivitiesRevenue || 0).toFixed(2),
        totalDayRevenue: Number(a.totalPayments || 0).toFixed(2),
        completedAt: a.completedAt
      })), 'night-audit-history');
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const executeAudit = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setMessage('');
    
    try {
      const res = await fetch(`/api/v1/night-audit/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Night Audit completed & daily revenues recalculated successfully!');
        fetchHistory();
      } else {
        setMessage(`Error: ${data.message || 'Failed to run audit'}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'An unexpected error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const runAudit = async () => {
    setShowConfirmModal(true);
  };

  const latestAudit = history.length > 0 ? history[0] : null;

  return (
    <div className="p-6 page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Moon className="text-indigo-400" />
            Night Audit
          </h1>
          <p className="text-slate-400">Run End-of-Day operations and finalize daily revenue across all departments</p>
        </div>
      </div>

      <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} />

      {/* Latest Audit / Today's Department Breakdown Summary Cards */}
      {latestAudit && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 my-4">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Rooms (Paid)</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{format(Number(latestAudit.totalRoomRevenue || 0))}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Food & Beverage</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{format(Number(latestAudit.totalFbRevenue || 0))}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Boutique</div>
            <div className="text-lg font-bold text-amber-400 mt-1">{format(Number(latestAudit.totalBoutiqueRevenue || 0))}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Entry Tickets</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">{format(Number(latestAudit.totalEntryTicketRevenue || 0))}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Pool Tickets</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">{format(Number(latestAudit.totalPoolTicketRevenue || 0))}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Events</div>
            <div className="text-lg font-bold text-purple-400 mt-1">{format(Number(latestAudit.totalEventsRevenue || 0))}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
            <div className="text-[11px] uppercase font-semibold text-slate-400">Activities / Tours / Pkg</div>
            <div className="text-lg font-bold text-amber-400 mt-1">{format(Number(latestAudit.totalActivitiesRevenue || 0))}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4 text-slate-200">
              <ShieldCheck className="text-amber-500" />
              <h2 className="text-lg font-bold">End of Day Process</h2>
            </div>
            
            <ul className="space-y-4 mb-6 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Verify all pending check-ins have arrived or been marked no-show.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Verify all pending check-outs have been settled.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Post automatic nightly room charges to in-house guest folios.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Calculate daily revenue for Rooms, F&B, Boutique, Entry, Pool, Events & Activities/Tours/Packages.</span>
              </li>
            </ul>

            {message && (
              <div className={`p-4 rounded-lg mb-6 text-sm ${message.startsWith('Error') ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                {message}
              </div>
            )}

            <button
              onClick={runAudit}
              disabled={isProcessing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Run End of Day Audit
                </>
              )}
            </button>
            
            <div className="mt-4 flex items-start gap-2 text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p>Running End of Day Audit finalizes and updates all department revenue totals for the day.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden h-full">
            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
              <History className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-100">Audit History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase">
                    <th className="p-3.5 font-semibold">Date</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold text-right">Room Rev</th>
                    <th className="p-3.5 font-semibold text-right">F&B Rev</th>
                    <th className="p-3.5 font-semibold text-right">Boutique</th>
                    <th className="p-3.5 font-semibold text-right">Entry & Pool</th>
                    <th className="p-3.5 font-semibold text-right">Events</th>
                    <th className="p-3.5 font-semibold text-right">Activities / Tours / Pkg</th>
                    <th className="p-3.5 font-semibold text-right">Total</th>
                    <th className="p-3.5 font-semibold">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">Loading history...</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">No night audits have been run yet.</td>
                    </tr>
                  ) : (
                    history.map((audit) => (
                      <tr key={audit.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 text-slate-300 whitespace-nowrap">
                          <div>{new Date(audit.auditDate).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500">
                            {audit.completedAt ? new Date(audit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            audit.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                            audit.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-emerald-400 font-medium whitespace-nowrap">
                          {format(Number(audit.totalRoomRevenue || 0))}
                        </td>
                        <td className="p-3.5 text-right text-emerald-400 font-medium whitespace-nowrap">
                          {format(Number(audit.totalFbRevenue || 0))}
                        </td>
                        <td className="p-3.5 text-right text-amber-400 font-medium whitespace-nowrap">
                          {format(Number(audit.totalBoutiqueRevenue || 0))}
                        </td>
                        <td className="p-3.5 text-right text-cyan-400 font-medium whitespace-nowrap">
                          <div>{format(Number(audit.totalTicketRevenue || 0))}</div>
                          <div className="text-[10px] text-slate-400">
                            Entry: {format(Number(audit.totalEntryTicketRevenue || 0))} | Pool: {format(Number(audit.totalPoolTicketRevenue || 0))}
                          </div>
                        </td>
                        <td className="p-3.5 text-right text-purple-400 font-medium whitespace-nowrap">
                          {format(Number(audit.totalEventsRevenue || 0))}
                        </td>
                        <td className="p-3.5 text-right text-amber-400 font-medium whitespace-nowrap">
                          {format(Number(audit.totalActivitiesRevenue || 0))}
                        </td>
                        <td className="p-3.5 text-right text-white font-bold whitespace-nowrap">
                          {format(Number(audit.totalPayments || 0))}
                        </td>
                        <td className="p-3.5 text-slate-300 whitespace-nowrap">
                          {audit.user ? `${audit.user.firstName} ${audit.user.lastName}` : 'System'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-amber-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Night Audit</h3>
                <p className="text-sm text-slate-400 mt-1">Are you sure you want to run the End of Day Audit? This will post nightly room charges and calculate daily revenues for Rooms, F&B, Boutique, Entry, Pool, Events, and Activities/Tours/Packages.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAudit}
                className="px-4 py-2 rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                Yes, Run Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
