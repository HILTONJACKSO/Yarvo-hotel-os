'use client';

import { useState, useEffect } from 'react';
import { Moon, History, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function NightAuditPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/night-audit/history`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const executeAudit = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setMessage('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/night-audit/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Night Audit completed successfully!');
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Moon className="text-indigo-400" />
            Night Audit
          </h1>
          <p className="text-slate-400">Run End-of-Day operations and finalize daily revenue</p>
        </div>
      </div>

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
                <span>Calculate and finalize daily revenue aggregates.</span>
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
              <p>This action is irreversible. It will close the financial day and lock transactions prior to this moment.</p>
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
                  <tr className="bg-slate-800/80 text-slate-400 text-sm">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Room Rev</th>
                    <th className="p-4 font-medium text-right">F&B Rev</th>
                    <th className="p-4 font-medium">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">Loading history...</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No night audits have been run yet.</td>
                    </tr>
                  ) : (
                    history.map((audit) => (
                      <tr key={audit.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-300">
                          <div>{new Date(audit.auditDate).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500">
                            Completed: {audit.completedAt ? new Date(audit.completedAt).toLocaleTimeString() : '-'}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            audit.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                            audit.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {audit.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-emerald-400 font-medium">
                          ${Number(audit.totalRoomRevenue || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-emerald-400 font-medium">
                          ${Number(audit.totalFbRevenue || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-300">
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
                <p className="text-sm text-slate-400 mt-1">Are you sure you want to run the End of Day Audit? This will post room charges to all active guest folios.</p>
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

