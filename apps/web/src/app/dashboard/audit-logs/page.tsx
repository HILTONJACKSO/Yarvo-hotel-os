'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { Search, Loader2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

// API_URL removed for relative proxy fetch
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/audit-logs');
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.data || data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = Array.isArray(logs) ? logs.filter(log => 
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track edit records for sensitive modules.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by action, entity, or user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">User</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Action</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Entity</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Entity Details</th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {log?.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white" title={log?.userId || 'System'}>
                        {log?.user ? `${log.user.firstName} ${log.user.lastName}` : (log?.userId ? String(log.userId).substring(0, 8) + '...' : 'System')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {log.entity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" title={log?.entityId}>
                        {log.newValues?.name || log.oldValues?.name || log.newValues?.number || log.oldValues?.number || log.newValues?.title || log.oldValues?.title || (log?.entityId ? String(log.entityId).substring(0, 8) + '...' : '')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => toggleRow(log.id)}
                          className="btn btn-ghost p-2"
                          title="View Changes"
                        >
                          {expandedRowId === log.id ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </td>
                    </tr>
                    {expandedRowId === log.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 dark:bg-gray-800/30 p-0 border-b border-gray-100 dark:border-gray-800">
                          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Old Values</h4>
                              <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-300">
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Values</h4>
                              <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-300">
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
      </div>
    </div>
  );
}
