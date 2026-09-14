import sys

with open("apps/web/src/app/dashboard/financials/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add date range state
old_state = """    const [pnlData, setPnlData] = useState<any>(null);
    const [bsData, setBsData] = useState<any>(null);
    const [tbData, setTbData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async (start?: string, end?: string) => {"""

new_state = """    const [pnlData, setPnlData] = useState<any>(null);
    const [bsData, setBsData] = useState<any>(null);
    const [tbData, setTbData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [dateRange, setDateRange] = useState(() => {
      const end = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = d.toISOString().split('T')[0];
      return { start, end };
    });

  const fetchReports = useCallback(async (start?: string, end?: string) => {"""

code = code.replace(old_state, new_state)

old_effect = """  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  const handleDateChange = (start: string, end: string) => {
    fetchReports(start, end);
  };"""

new_effect = """  useEffect(() => {
    fetchReports(dateRange.start, dateRange.end);
  }, [fetchReports, dateRange]);
  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };"""

code = code.replace(old_effect, new_effect)

old_toolbar = """      <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} />"""
new_toolbar = """      <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} initialStartDate={dateRange.start} initialEndDate={dateRange.end} />"""
code = code.replace(old_toolbar, new_toolbar)

with open("apps/web/src/app/dashboard/financials/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
