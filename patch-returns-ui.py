import sys
import re

with open("apps/web/src/app/dashboard/returns/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the state and fetch logic
old_fetch = """  const [returns, setReturns] = useState<PosReturnRequest[]>([]);

  const fetchReturns = useCallback((start?: string, end?: string) => {
    let query = '';
    if (start && end) query = `?start=${start}&end=${end}`;
    fetch(`${API_URL}/api/v1/pos/returns${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setReturns(data.data || data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchReturns();
    const interval = setInterval(() => fetchReturns(), 5000);
    return () => clearInterval(interval);
  }, [fetchReturns]);

  const handleDateChange = (start: string, end: string) => {
    fetchReturns(start, end);
  };"""

new_fetch = """  const [returns, setReturns] = useState<PosReturnRequest[]>([]);

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const start = d.toISOString().split('T')[0];
    return { start, end };
  });

  const fetchReturns = useCallback(() => {
    const query = `?start=${dateRange.start}&end=${dateRange.end}`;
    fetch(`${API_URL}/api/v1/pos/returns${query}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setReturns(data.data || data))
      .catch(console.error);
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchReturns();
    const interval = setInterval(() => fetchReturns(), 5000);
    return () => clearInterval(interval);
  }, [fetchReturns]);

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };"""

code = code.replace(old_fetch, new_fetch)

# Replace ReportExportToolbar usage
old_toolbar = """<ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} />"""
new_toolbar = """<ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} initialStartDate={dateRange.start} initialEndDate={dateRange.end} />"""

code = code.replace(old_toolbar, new_toolbar)

with open("apps/web/src/app/dashboard/returns/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
