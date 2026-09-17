'use client';

import React, { useState, useEffect } from 'react';
import { addDays, format, startOfToday, eachDayOfInterval, isWithinInterval, parseISO, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, subWeeks, addWeeks } from 'date-fns';

type Reservation = {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  guest: { firstName: string; lastName: string };
  folio: { balance: string } | null;
};

type Room = {
  id: string;
  number: string;
  roomType: { name: string };
  reservations: Reservation[];
};

import { Download, FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

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
    let csv = "Room,Type,Guest,Check In,Check Out,Status\n";
    rooms.forEach(room => {
      room.reservations.forEach(res => {
        csv += `"${room.number}","${room.roomType.name}","${res.guest.firstName} ${res.guest.lastName}","${res.checkInDate}","${res.checkOutDate}","${res.status}"\n`;
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


  const fetchRooms = async () => {
    setLoading(true);
    try {
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();
      
      const [roomsRes, reservationsRes] = await Promise.all([
        fetch(`/api/v1/rooms/calendar?start=${startStr}&end=${endStr}`, { credentials: 'include' }),
        fetch(`/api/v1/reservations?limit=1000`, { credentials: 'include' })
      ]);
      
      const roomsJson = await roomsRes.json();
      const resJson = await reservationsRes.json();
      
      if (roomsRes.ok) {
        const fetchedRooms = roomsJson.data || [];
        
        if (reservationsRes.ok) {
          const allReservations = resJson.data || [];
          const unassigned = allReservations.filter((r: any) => !r.room && r.status !== 'CANCELLED');
          
          if (unassigned.length > 0) {
            fetchedRooms.unshift({
              id: 'unassigned',
              number: 'Unassigned',
              roomType: { name: 'Hold / Pending' },
              reservations: unassigned,
            });
          }
        }
        
        setRooms(fetchedRooms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: Reservation | null;
    room: string;
  }>({ visible: false, x: 0, y: 0, data: null, room: '' });

  const handleMouseEnter = (e: React.MouseEvent, res: Reservation, roomNum: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + window.scrollX + (rect.width / 2),
      y: rect.top + window.scrollY - 10,
      data: res,
      room: roomNum,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  if (loading) return <div className="loading-state">Loading calendar...</div>;

  return (
    <div className="calendar-container">
      <div className="calendar-header-actions print-hide">
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
      </div>

      <div className="calendar-scroll-area">
        <div className="calendar-grid" style={{ gridTemplateColumns: `150px repeat(${days.length}, minmax(80px, 1fr))` }}>
          
          {/* Header Row */}
          <div className="grid-cell header-cell sticky-col">Room</div>
          {days.map((d, i) => (
            <div key={i} className={`grid-cell header-cell ${d.getTime() === today.getTime() ? 'today-col' : ''}`}>
              <div className="day-name">{format(d, 'EEE')}</div>
              <div className="day-num">{format(d, 'd')}</div>
            </div>
          ))}

          {/* Room Rows */}
          {rooms.map(room => (
            <React.Fragment key={room.id}>
              <div className="grid-cell room-cell sticky-col">
                <span className="room-num">{room.number}</span>
                <span className="room-type">{room.roomType.name}</span>
              </div>
              
              {days.map((d, i) => {
                const currentDay = startOfDay(d);
                // Find reservation that covers this day
                const res = room.reservations.find(r => {
                  const checkIn = startOfDay(parseISO(r.checkInDate));
                  const checkOut = startOfDay(parseISO(r.checkOutDate));
                  // Only count if day is >= checkIn and < checkOut
                  return currentDay >= checkIn && currentDay < checkOut;
                });

                return (
                  <div key={i} className={`grid-cell day-cell ${d.getTime() === today.getTime() ? 'today-col' : ''}`}>
                    {res && (
                      <div 
                        className={`res-block status-${res.status.toLowerCase()}`}
                        onMouseEnter={(e) => handleMouseEnter(e, res, room.number)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Only show text on the first day of the block or first day of view */}
                        {(currentDay.getTime() === startOfDay(parseISO(res.checkInDate)).getTime() || i === 0) && (
                          <span className="res-name">{res.guest.lastName}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {tooltip.visible && tooltip.data && (
        <div 
          className="calendar-tooltip" 
          style={{ 
            left: tooltip.x, 
            top: tooltip.y, 
            transform: 'translate(-50%, -100%)' 
          }}
        >
          <div className="tt-header">Room {tooltip.room}</div>
          <div className="tt-body">
            <div><strong>Guest:</strong> {tooltip.data.guest.firstName} {tooltip.data.guest.lastName}</div>
            <div><strong>Status:</strong> {tooltip.data.status.replace('_', ' ')}</div>
            <div><strong>In:</strong> {format(parseISO(tooltip.data.checkInDate), 'MMM d, yyyy')}</div>
            <div><strong>Out:</strong> {format(parseISO(tooltip.data.checkOutDate), 'MMM d, yyyy')}</div>
            <div className="tt-balance">
              <strong>Balance Due:</strong> ${Number(tooltip.data.folio?.balance || 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <style>{`
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
        .calendar-container {
          background: hsl(222, 35%, 7%);
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 8px;
          padding: 16px;
        }
        .calendar-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .calendar-scroll-area {
          overflow-x: auto;
          border: 1px solid hsl(217, 20%, 14%);
          border-radius: 6px;
        }
        .calendar-grid {
          display: grid;
          min-width: max-content;
        }
        .grid-cell {
          padding: 12px 8px;
          border-right: 1px solid hsl(217, 20%, 14%);
          border-bottom: 1px solid hsl(217, 20%, 14%);
          position: relative;
        }
        .header-cell {
          background: hsl(220, 30%, 10%);
          text-align: center;
          font-size: 0.875rem;
          color: hsl(215, 20%, 65%);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .today-col {
          background: hsl(222, 35%, 11%);
        }
        .sticky-col {
          position: sticky;
          left: 0;
          background: hsl(220, 30%, 10%);
          z-index: 3;
          border-right: 2px solid hsl(217, 20%, 18%);
        }
        .header-cell.sticky-col {
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .day-name { font-size: 0.75rem; text-transform: uppercase; }
        .day-num { font-size: 1.1rem; color: white; margin-top: 4px; }
        
        .room-cell {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .room-num { color: white; font-weight: 600; font-size: 1rem; }
        .room-type { color: hsl(215, 20%, 55%); font-size: 0.75rem; margin-top: 4px; }

        .day-cell {
          padding: 4px;
        }

        .res-block {
          height: 100%;
          min-height: 40px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 0 8px;
          cursor: pointer;
          position: relative;
          z-index: 1;
          transition: transform 0.1s, opacity 0.2s;
        }
        .res-block:hover {
          opacity: 0.9;
          transform: scale(1.02);
          z-index: 2;
        }
        .res-name {
          color: white;
          font-size: 0.8125rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-confirmed { background: hsl(210, 100%, 40%); border: 1px solid hsl(210, 100%, 50%); }
        .status-checked_in { background: hsl(142, 76%, 30%); border: 1px solid hsl(142, 76%, 40%); }
        .status-checked_out { background: hsl(215, 20%, 30%); border: 1px solid hsl(215, 20%, 40%); }

        .calendar-tooltip {
          position: absolute;
          background: hsl(222, 35%, 15%);
          border: 1px solid hsl(217, 20%, 25%);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          border-radius: 8px;
          padding: 16px;
          pointer-events: none;
          z-index: 9999;
          min-width: 220px;
        }
        .calendar-tooltip::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 12px;
          height: 12px;
          background: hsl(222, 35%, 15%);
          border-right: 1px solid hsl(217, 20%, 25%);
          border-bottom: 1px solid hsl(217, 20%, 25%);
        }
        .tt-header {
          color: white;
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 12px;
          border-bottom: 1px solid hsl(217, 20%, 25%);
          padding-bottom: 8px;
        }
        .tt-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: hsl(210, 40%, 92%);
          font-size: 0.875rem;
        }
        .tt-body strong { color: hsl(215, 20%, 65%); }
        .tt-balance {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed hsl(217, 20%, 25%);
        }
        .tt-balance strong { color: hsl(43, 96%, 56%); }
      `}</style>
    </div>
  );
}

