'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Search, Loader2, Eye, EyeOff, Tag, RefreshCcw, Package } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'RETURNS_DISCOUNTS' | 'ALL'>('INVENTORY');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/v1/audit-logs`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.data || data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allFilteredLogs = Array.isArray(logs) ? logs.filter(log => 
    log?.action?.toLowerCase()?.includes(search.toLowerCase()) || 
    log?.entity?.toLowerCase()?.includes(search.toLowerCase()) ||
    (log?.userId && String(log.userId).toLowerCase().includes(search.toLowerCase()))
  ) : [];

  const toggleRow = (id: string) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
    }
  };

  const renderTable = (dataLogs: AuditLog[], emptyMessage: string) => (
    <div className="table-container">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[hsl(217,20%,18%)]">
            <th className="px-4 py-3 font-semibold text-white">Timestamp</th>
            <th className="px-4 py-3 font-semibold text-white">User</th>
            <th className="px-4 py-3 font-semibold text-white">Action</th>
            <th className="px-4 py-3 font-semibold text-white">Entity</th>
            <th className="px-4 py-3 font-semibold text-white">Entity Details</th>
            <th className="px-4 py-3 font-semibold text-white text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(217,20%,18%)]">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-[hsl(215,20%,65%)]">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                Loading audit logs...
              </td>
            </tr>
          ) : dataLogs.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-[hsl(215,20%,65%)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            dataLogs.map((log) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-[hsl(216,22%,18%)] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-[hsl(215,20%,65%)]">
                    {log?.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white" title={log?.userId || 'System'}>
                    {log?.user ? `${log.user.firstName} ${log.user.lastName}` : (log?.userId ? String(log.userId).substring(0, 8) + '...' : 'System')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[hsl(220,30%,20%)] text-[hsl(210,40%,96%)]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {log.entity}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(215,20%,65%)]" title={log?.entityId}>
                    {log.newValues?.name || log.oldValues?.name || log.newValues?.number || log.oldValues?.number || log.newValues?.title || log.oldValues?.title || (log?.entityId ? String(log.entityId).substring(0, 8) + '...' : '')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => toggleRow(log.id)}
                      className="btn btn-ghost p-2 text-[hsl(215,20%,65%)] hover:text-white"
                      title="View Changes"
                    >
                      {expandedRowId === log.id ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </td>
                </tr>
                {expandedRowId === log.id && (
                  <tr>
                    <td colSpan={6} className="bg-[hsl(222,35%,7%)] p-0 border-b border-[hsl(217,20%,18%)]">
                      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Old Values</h4>
                          <pre className="bg-[hsl(224,39%,4%)] p-3 rounded-lg text-xs overflow-x-auto text-white">
                            {JSON.stringify(log.oldValues, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">New Values</h4>
                          <pre className="bg-[hsl(224,39%,4%)] p-3 rounded-lg text-xs overflow-x-auto text-white">
                            {JSON.stringify(log.newValues, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Tracking</h1>
          <p className="text-sm text-[hsl(215,20%,65%)] mt-1">
            Track edit records for sensitive modules.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 p-1 bg-[hsl(222,35%,7%)] rounded-lg w-full max-w-2xl border border-[hsl(217,20%,18%)]">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'INVENTORY' 
              ? 'bg-[hsl(220,30%,15%)] text-white shadow-sm ring-1 ring-[hsl(217,20%,28%)]' 
              : 'text-[hsl(215,20%,65%)] hover:text-white'
          }`}
        >
          <Package size={16} />
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('RETURNS_DISCOUNTS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'RETURNS_DISCOUNTS' 
              ? 'bg-[hsl(220,30%,15%)] text-white shadow-sm ring-1 ring-[hsl(217,20%,28%)]' 
              : 'text-[hsl(215,20%,65%)] hover:text-white'
          }`}
        >
          <RefreshCcw size={16} />
          Returns & Discounts
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'ALL' 
              ? 'bg-[hsl(220,30%,15%)] text-white shadow-sm ring-1 ring-[hsl(217,20%,28%)]' 
              : 'text-[hsl(215,20%,65%)] hover:text-white'
          }`}
        >
          <Search size={16} />
          All Logs
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[hsl(217,20%,18%)]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={20} />
            <input
              type="text"
              placeholder="Search by action, entity, or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {activeTab === 'INVENTORY' && (
          renderTable(
            allFilteredLogs.filter(l => l.entity.toLowerCase().includes('inventory')),
            'No inventory logs found.'
          )
        )}

        {activeTab === 'RETURNS_DISCOUNTS' && (
          <div className="flex flex-col">
            <div className="p-4 pb-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <RefreshCcw size={18} /> Returns
              </h3>
            </div>
            {renderTable(
              allFilteredLogs.filter(l => l.entity === 'PosReturn' || l.action.includes('RETURN')),
              'No return logs found.'
            )}
            
            <div className="w-full border-t-[3px] border-dashed border-[hsl(217,20%,18%)] my-4" />
            
            <div className="p-4 pb-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Tag size={18} /> Discounts
              </h3>
            </div>
            {renderTable(
              allFilteredLogs.filter(l => l.action === 'APPLY_DISCOUNT' || l.action.includes('DISCOUNT')),
              'No discount logs found.'
            )}
          </div>
        )}

        {activeTab === 'ALL' && (
          renderTable(allFilteredLogs, 'No audit logs found.')
        )}
      </div>
    </div>
  );
}
