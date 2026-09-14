import sys
import re

with open("apps/web/src/app/dashboard/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add ReportExportToolbar import
code = code.replace("import { format } from 'date-fns';", "import { format } from 'date-fns';\nimport ReportExportToolbar from '@/components/ReportExportToolbar';\nimport { useCallback } from 'react';\nimport { downloadCSV } from '@/utils/export';")

# Replace fetchLogs
old_fetch = """  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');

  const toggleExpand = (id: string) => {
    if (expandedLogId === id) setExpandedLogId(null);
    else setExpandedLogId(id);
  };

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
  };"""

new_fetch = """  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const start = d.toISOString().split('T')[0];
    return { start, end };
  });

  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');

  const toggleExpand = (id: string) => {
    if (expandedLogId === id) setExpandedLogId(null);
    else setExpandedLogId(id);
  };

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const query = `?start=${dateRange.start}&end=${dateRange.end}`;
      const res = await fetch(`${API_URL}/api/v1/audit-logs${query}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.data || data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleExport = (format: 'pdf' | 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
    } else if (format === 'csv') {
      const csvData = logs.map(l => ({
        date: new Date(l.createdAt).toLocaleString(),
        user: l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
        action: l.action,
        entity: l.entity,
      }));
      downloadCSV(csvData, 'audit-logs');
    }
  };"""

code = code.replace(old_fetch, new_fetch)

# Insert the ReportExportToolbar below the title
old_jsx = """  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Tracking</h1>
          <p className="text-sm text-[hsl(215,20%,65%)] mt-1">
            Track edit records for sensitive modules.
          </p>
        </div>
      </div>"""

new_jsx = """  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Tracking</h1>
          <p className="text-sm text-[hsl(215,20%,65%)] mt-1">
            Track edit records for sensitive modules.
          </p>
        </div>
      </div>

      <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} initialStartDate={dateRange.start} initialEndDate={dateRange.end} />"""

code = code.replace(old_jsx, new_jsx)

with open("apps/web/src/app/dashboard/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
