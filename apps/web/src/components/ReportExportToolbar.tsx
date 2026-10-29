import { useState } from 'react';
import { Calendar, Download, Printer, Filter, CalendarDays, CalendarRange, Sparkles } from 'lucide-react';

interface ReportExportToolbarProps {
  onDateChange: (start: string, end: string) => void;
  onExport: (format: 'pdf' | 'csv' | 'print') => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialPreset?: 'auto' | 'today' | 'last7' | 'this_week' | 'this_month' | 'custom';
}

export default function ReportExportToolbar({ 
  onDateChange, 
  onExport, 
  initialStartDate, 
  initialEndDate,
  initialPreset = 'auto'
}: ReportExportToolbarProps) {
  const [activePreset, setActivePreset] = useState<'auto' | 'today' | 'last7' | 'this_week' | 'this_month' | 'custom'>(
    initialStartDate || initialEndDate ? 'custom' : initialPreset
  );
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [endDate, setEndDate] = useState(initialEndDate || '');

  const formatDateYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApply = () => {
    setActivePreset('custom');
    onDateChange(startDate, endDate);
  };

  const setAuto = () => {
    setActivePreset('auto');
    setStartDate('');
    setEndDate('');
    onDateChange('', '');
  };

  const setToday = () => {
    setActivePreset('today');
    const todayStr = formatDateYMD(new Date());
    setStartDate(todayStr);
    setEndDate(todayStr);
    onDateChange(todayStr, todayStr);
  };

  const setLast7Days = () => {
    setActivePreset('last7');
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const sStr = formatDateYMD(start);
    const eStr = formatDateYMD(end);
    setStartDate(sStr);
    setEndDate(eStr);
    onDateChange(sStr, eStr);
  };

  const setThisWeek = () => {
    setActivePreset('this_week');
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const sStr = formatDateYMD(start);
    const eStr = formatDateYMD(end);
    setStartDate(sStr);
    setEndDate(eStr);
    onDateChange(sStr, eStr);
  };

  const setThisMonth = () => {
    setActivePreset('this_month');
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const sStr = formatDateYMD(start);
    const eStr = formatDateYMD(end);
    setStartDate(sStr);
    setEndDate(eStr);
    onDateChange(sStr, eStr);
  };

  return (
    <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 mb-6 gap-4 shadow-lg shadow-slate-900/20">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <Calendar size={18} className="text-cyan-400" />
          <span>Date Range:</span>
        </div>
        <input 
          type="date" 
          value={startDate}
          placeholder="Start Date"
          onChange={(e) => {
            setStartDate(e.target.value);
            setActivePreset('custom');
          }}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <span className="text-slate-500">to</span>
        <input 
          type="date" 
          value={endDate}
          placeholder="End Date"
          onChange={(e) => {
            setEndDate(e.target.value);
            setActivePreset('custom');
          }}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button 
          onClick={handleApply}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <Filter size={14} />
          Apply
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1"></div>
        <button 
          onClick={setAuto}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
            activePreset === 'auto'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-transparent'
          }`}
          title="Auto / All Records (Continuous records across days without cutoff)"
        >
          <Sparkles size={14} className={activePreset === 'auto' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
          Auto
        </button>
        <button 
          onClick={setToday}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            activePreset === 'today'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-transparent'
          }`}
          title="Today (00:00 - 23:59)"
        >
          <Calendar size={14} />
          Today
        </button>
        <button 
          onClick={setLast7Days}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activePreset === 'last7'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-transparent'
          }`}
          title="Last 7 Days"
        >
          <CalendarDays size={14} />
          Last 7 Days
        </button>
        <button 
          onClick={setThisWeek}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activePreset === 'this_week'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-transparent'
          }`}
          title="This Week (Mon - Sun)"
        >
          <CalendarDays size={14} />
          This Week
        </button>
        <button 
          onClick={setThisMonth}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activePreset === 'this_month'
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-transparent'
          }`}
          title="This Month (1st - End)"
        >
          <CalendarRange size={14} />
          This Month
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onExport('pdf')}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-600"
        >
          <Download size={16} className="text-emerald-400" />
          PDF
        </button>
        <button 
          onClick={() => onExport('csv')}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-600"
        >
          <Download size={16} className="text-amber-400" />
          CSV
        </button>
        <button 
          onClick={() => onExport('print')}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-600"
        >
          <Printer size={16} className="text-blue-400" />
          Print
        </button>
      </div>
    </div>
  );
}
