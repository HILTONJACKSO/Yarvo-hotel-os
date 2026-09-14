import sys

with open("apps/web/src/components/ReportExportToolbar.tsx", "r", encoding="utf-8") as f:
    code = f.read()

import_statement = "import { Calendar, Download, Printer, Filter } from 'lucide-react';"
new_imports = "import { Calendar, Download, Printer, Filter, CalendarDays, CalendarRange } from 'lucide-react';"
code = code.replace(import_statement, new_imports)

quick_buttons_js = """
  const handleApply = () => {
    onDateChange(startDate, endDate);
  };

  const setThisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    setStartDate(sStr);
    setEndDate(eStr);
    onDateChange(sStr, eStr);
  };

  const setThisMonth = () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    // safe format
    const sStr = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const eStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    setStartDate(sStr);
    setEndDate(eStr);
    onDateChange(sStr, eStr);
  };
"""

code = code.replace("  const handleApply = () => {\n    onDateChange(startDate, endDate);\n  };", quick_buttons_js)

apply_btn = """        <button 
          onClick={handleApply}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <Filter size={14} />
          Apply
        </button>"""

new_btns = apply_btn + """
        <div className="w-px h-6 bg-slate-700 mx-1"></div>
        <button 
          onClick={setThisWeek}
          className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          title="This Week (Mon - Sun)"
        >
          <CalendarDays size={14} />
          This Week
        </button>
        <button 
          onClick={setThisMonth}
          className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          title="This Month (1st - End)"
        >
          <CalendarRange size={14} />
          This Month
        </button>"""

code = code.replace(apply_btn, new_btns)

# Also fix the initial state in toolbar to re-sync if props change? 
# Usually initialStartDate is enough, since the parent passes it on mount.
# Oh, we need to update `useEffect` if initialStartDate changes?
# In this app, it doesn't matter because it mounts once per page load.

with open("apps/web/src/components/ReportExportToolbar.tsx", "w", encoding="utf-8") as f:
    f.write(code)
