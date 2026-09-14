import sys
import re

with open("apps/web/src/app/dashboard/audit-logs/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Insert state
state_code = """  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const start = d.toISOString().split('T')[0];
    return { start, end };
  });

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const handleExport = (format: 'pdf' | 'csv' | 'print') => {
    if (format === 'print') {
      window.print();
    } else if (format === 'csv') {
      const csvData = Array.isArray(logs) ? logs.map(l => ({
        date: new Date(l.createdAt).toLocaleString(),
        user: l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
        action: l.action,
        entity: l.entity,
      })) : [];
      downloadCSV(csvData, 'audit-logs');
    }
  };"""

code = re.sub(r'const \[expandedLogId, setExpandedLogId\] = useState<string \| null>\(null\);', state_code, code)


# Replace fetchLogs
old_fetch = """  useEffect(() => {
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

new_fetch = """  const fetchLogs = useCallback(async () => {
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
  }, [fetchLogs]);"""

code = code.replace(old_fetch, new_fetch)

with open("apps/web/src/app/dashboard/audit-logs/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
