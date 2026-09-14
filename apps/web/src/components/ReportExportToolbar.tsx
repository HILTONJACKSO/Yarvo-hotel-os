import { useState } from 'react';
import { Calendar, Download, Printer, Filter, CalendarDays, CalendarRange } from 'lucide-react';

interface ReportExportToolbarProps {
  onDateChange: (start: string, end: string) => void;
  onExport: (format: 'pdf' | 'csv' | 'print') => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function ReportExportToolbar({ onDateChange, onExport, initialStartDate, initialEndDate }: ReportExportToolbarProps) {
  const [startDate, setStartDate] = useState(initialStartDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialEndDate || new Date().toISOString().split('T')[0]);


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


  return (
    <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 mb-6 gap-4 shadow-lg shadow-slate-900/20">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <Calendar size={18} className="text-cyan-400" />
          <span>Date Range:</span>
        </div>
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <span className="text-slate-500">to</span>
        <input 
          type="date" 
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
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
