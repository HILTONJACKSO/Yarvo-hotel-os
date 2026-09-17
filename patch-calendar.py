import sys

with open("apps/web/src/components/reservations/RoomCalendar.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the datefns imports
import_statement = "import { addDays, format, startOfToday, eachDayOfInterval, isWithinInterval, parseISO, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, subWeeks, addWeeks } from 'date-fns';"
code = code.replace("import { addDays, format, startOfToday, eachDayOfInterval, isWithinInterval, parseISO, startOfDay } from 'date-fns';", import_statement)

# Replace the states
old_states = """export function RoomCalendar() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create a 30 day window: 3 days past, today, 26 days future
  const today = startOfToday();
  const startDate = addDays(today, -3);
  const endDate = addDays(today, 26);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    fetchRooms();
  }, []);"""

new_states = """import { Download, FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

export function RoomCalendar() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = startOfToday();
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [baseDate, setBaseDate] = useState(today);

  let startDate = today;
  let endDate = today;

  if (viewMode === 'MONTH') {
    startDate = startOfMonth(baseDate);
    endDate = endOfMonth(baseDate);
  } else if (viewMode === 'WEEK') {
    startDate = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
    endDate = endOfWeek(baseDate, { weekStartsOn: 1 }); // Sunday
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    fetchRooms();
  }, [startDate.getTime(), endDate.getTime()]);

  const navigatePrev = () => {
    if (viewMode === 'MONTH') setBaseDate(subMonths(baseDate, 1));
    else setBaseDate(subWeeks(baseDate, 1));
  };

  const navigateNext = () => {
    if (viewMode === 'MONTH') setBaseDate(addMonths(baseDate, 1));
    else setBaseDate(addWeeks(baseDate, 1));
  };
  
  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    let csv = "Room,Type,Guest,Check In,Check Out,Status\\n";
    rooms.forEach(room => {
      room.reservations.forEach(res => {
        csv += `"${room.number}","${room.roomType.name}","${res.guest.firstName} ${res.guest.lastName}","${res.checkInDate}","${res.checkOutDate}","${res.status}"\\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'reservations.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
"""

code = code.replace(old_states, new_states)

# Replace the header actions
old_header = """      <div className="calendar-header-actions">
        <h3 style={{ color: 'white', margin: 0 }}>30-Day Outlook</h3>
        <span style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem' }}>
          {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
        </span>
      </div>"""

new_header = """      <div className="calendar-header-actions print-hide">
        <div className="flex items-center gap-4">
          <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>30 - Day Booking</h3>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button onClick={() => { setViewMode('WEEK'); setBaseDate(today); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'WEEK' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>This Week</button>
            <button onClick={() => { setViewMode('MONTH'); setBaseDate(today); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'MONTH' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>This Month</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={navigatePrev} className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-slate-300"><ChevronLeft size={16} /></button>
            <span style={{ color: 'hsl(215, 20%, 65%)', fontSize: '0.875rem', minWidth: '160px', textAlign: 'center' }}>
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </span>
            <button onClick={navigateNext} className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-slate-300"><ChevronRight size={16} /></button>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"><Download size={14} /> CSV</button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"><Printer size={14} /> Print / PDF</button>
          </div>
        </div>
      </div>"""
code = code.replace(old_header, new_header)

# Add print styles
old_style_start = """      <style>{`
        .calendar-container {"""

new_style_start = """      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body * { visibility: hidden; }
          .calendar-container, .calendar-container * { visibility: visible; }
          .calendar-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; background: white; }
          .print-hide { display: none !important; }
          .calendar-scroll-area { overflow: visible !important; border: none; }
          .header-cell, .sticky-col { background: #f1f5f9 !important; color: #000 !important; border-color: #cbd5e1 !important; position: static !important; }
          .day-num, .room-num, .res-name, .tt-header { color: #000 !important; }
          .room-type, .tt-body, .tt-balance { color: #475569 !important; }
          .grid-cell { border-color: #cbd5e1 !important; }
          .calendar-grid { min-width: 100% !important; grid-template-columns: 120px repeat(${days.length}, minmax(40px, 1fr)) !important; }
          .res-block { background: #e2e8f0 !important; border: 1px solid #cbd5e1 !important; }
          .status-confirmed { background: #bfdbfe !important; border-color: #3b82f6 !important; }
          .status-checked_in { background: #bbf7d0 !important; border-color: #22c55e !important; }
          .status-checked_out { background: #e2e8f0 !important; border-color: #94a3b8 !important; }
          .res-name { color: #000 !important; font-size: 0.7rem; }
          .day-num { font-size: 0.9rem; margin-top: 2px; }
          .day-name { font-size: 0.65rem; }
          .room-num { font-size: 0.85rem; }
          .grid-cell { padding: 4px 2px; }
        }
        .calendar-container {"""

code = code.replace(old_style_start, new_style_start)

with open("apps/web/src/components/reservations/RoomCalendar.tsx", "w", encoding="utf-8") as f:
    f.write(code)
