"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Home as HomeIcon, X, CheckCircle, Bed, Sparkles, Phone, Mail, User, ShieldCheck, Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export const BookingBarInteractive = () => {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
  const [roomsCount, setRoomsCount] = useState('1');
  const [roomTypeId, setRoomTypeId] = useState('');
  
  // Guest details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [confirmationPreference, setConfirmationPreference] = useState<'both' | 'whatsapp' | 'email'>('both');
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<{activityId: string, quantity: number}[]>([]);

  const router = useRouter();

  // Set default dates and mounted state
  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
    
    // Fetch CMS to check for blocked rooms, then load active room types
    fetch('/api/cms')
      .then(res => res.json())
      .then(cmsRes => {
        const blockedNames = new Set<string>();
        if (cmsRes.success && cmsRes.data?.rooms?.items) {
          cmsRes.data.rooms.items.forEach((it: any) => {
            if (it.isBlocked || it.blocked) {
              blockedNames.add((it.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
            }
          });
        }
        return blockedNames;
      })
      .catch(() => new Set<string>())
      .then(blockedNames => {
        fetch('/api/booking')
          .then(res => res.json())
          .then(data => {
            const list = data.success && Array.isArray(data.data) && data.data.length > 0 ? data.data : [];
            const filterActive = (arr: any[]) => arr.filter(rt => {
              const norm = (rt.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const b of blockedNames) {
                if (b && norm.includes(b)) return false;
              }
              return true;
            });

            if (list.length > 0) {
              const active = filterActive(list);
              if (active.length > 0) {
                setRoomTypes(active);
                setRoomTypeId(active[0].id);
              }
            } else {
              fetch('/api/v1/public/room-types')
                .then(r => r.json())
                .then(d => {
                  if (d.data && d.data.length > 0) {
                    const active = filterActive(d.data);
                    if (active.length > 0) {
                      setRoomTypes(active);
                      setRoomTypeId(active[0].id);
                    }
                  }
                });
            }
          })
          .catch(err => console.error('Failed to fetch room types', err));
      });

    // Fetch activities
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setActivities(Array.isArray(data.data) ? data.data : []);
        }
      })
      .catch(err => console.error('Failed to fetch activities', err));

    const handleOpenBooking = (e: any) => {
      if (e.detail?.roomTypeId) {
        setRoomTypeId(e.detail.roomTypeId);
      }
      setIsModalOpen(true);
      setIsSuccess(false);
      setConfirmedBooking(null);
      setError('');
    };

    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const handleCheckAvailability = () => {
    setIsModalOpen(true);
    setIsSuccess(false);
    setConfirmedBooking(null);
    setError('');
  };

  const selectedRoom = roomTypes.find(r => r.id === roomTypeId);
  const nights = Math.max(1, Math.round((new Date(checkOut || Date.now()).getTime() - new Date(checkIn || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) || 1);
  const roomCountNum = Math.max(1, parseInt(roomsCount, 10) || 1);
  const rateNum = selectedRoom?.baseRateUsd ? Number(selectedRoom.baseRateUsd) : (selectedRoom?.price ? Number(String(selectedRoom.price).replace(/[^0-9.]/g, '')) : 35);
  const roomStaySubtotal = rateNum * nights * roomCountNum;
  const activitiesTotalNum = selectedActivities
    .filter(a => a.quantity > 0)
    .reduce((sum, sel) => {
      const actObj = activities.find(x => x.id === sel.activityId);
      return sum + Number(actObj?.price || 0) * sel.quantity;
    }, 0);
  const totalStayPrice = (roomStaySubtotal + activitiesTotalNum).toFixed(2);

  const handlePrintConfirmation = (b: any) => {
    if (!b || typeof window === 'undefined') return;
    const printWin = window.open('', '_blank', 'width=820,height=900');
    if (!printWin) {
      window.print();
      return;
    }
    const activitiesRows = Array.isArray(b.activities) && b.activities.length > 0
      ? b.activities.map((a: any) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Activity: ${a.name} (×${a.quantity})</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${Number(a.totalPrice).toFixed(2)}</td>
          </tr>
        `).join('')
      : '';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Confirmation - ${b.confirmationCode}</title>
          <style>
            body { font-family: Georgia, serif; color: #1F1F1F; background: #fff; margin: 0; padding: 32px; }
            .card { max-width: 680px; margin: 0 auto; border: 2px solid #1B2418; border-radius: 14px; overflow: hidden; }
            .header { background: #1B2418; color: #fff; padding: 24px 28px; text-align: center; }
            .header p { margin: 0 0 6px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #DFB776; font-family: sans-serif; }
            .header h1 { margin: 0; font-size: 24px; }
            .body { padding: 28px; font-family: sans-serif; }
            .ref-box { background: #FAF7EE; border: 1px solid #E8E1D7; border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 20px; font-size: 14px; }
            .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B6F72; margin-bottom: 2px; }
            .val { font-weight: 600; color: #1F1F1F; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
            .total-row td { padding-top: 12px; font-size: 18px; font-weight: 700; color: #1B2418; }
            .footer { margin-top: 24px; font-size: 12px; color: #6B6F72; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <p>Kwalee Beach Resort • Official Reservation Slip</p>
              <h1>Room Reserved & Booking Confirmed</h1>
            </div>
            <div class="body">
              <div class="ref-box">
                <div>
                  <div class="label">Booking Reference</div>
                  <div style="font-size: 22px; font-weight: 800; font-family: monospace; color: #1B2418;">${b.confirmationCode}</div>
                </div>
                <div style="text-align: right;">
                  <div class="label">Assigned Unit / Status</div>
                  <div class="val">${b.roomNumber} • CONFIRMED</div>
                </div>
              </div>
              <div class="grid">
                <div><div class="label">Guest Name</div><div class="val">${b.fullName}</div></div>
                <div><div class="label">Email Address</div><div class="val">${b.email}</div></div>
                <div><div class="label">Phone / WhatsApp</div><div class="val">${b.whatsapp}</div></div>
                <div><div class="label">Booked On</div><div class="val">${b.bookedAt}</div></div>
                <div><div class="label">Accommodation</div><div class="val">${b.roomTypeName} (${b.roomsCount} Unit${b.roomsCount > 1 ? 's' : ''})</div></div>
                <div><div class="label">Guests</div><div class="val">${b.guests} Guest(s)</div></div>
                <div><div class="label">Check-In Date</div><div class="val">${b.checkIn} (2:00 PM)</div></div>
                <div><div class="label">Check-Out Date</div><div class="val">${b.checkOut} (11:00 AM • ${b.nights} Night${b.nights > 1 ? 's' : ''})</div></div>
              </div>
              ${b.specialRequests ? `<div style="margin-bottom: 16px;"><div class="label">Special Requests</div><div class="val" style="font-weight: 400;">${b.specialRequests}</div></div>` : ''}
              <table>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${b.roomTypeName} (${b.nights} night(s) × ${b.roomsCount} unit(s) @ $${Number(b.roomRate).toFixed(2)})</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${Number(b.roomSubtotal).toFixed(2)}</td>
                </tr>
                ${activitiesRows}
                <tr class="total-row">
                  <td>Total Booking Amount</td>
                  <td style="text-align: right;">$${Number(b.totalAmount).toFixed(2)}</td>
                </tr>
              </table>
              <div class="footer">
                Please present this confirmation slip or your reference code (${b.confirmationCode}) at the Front Desk upon arrival.<br/>
                Kwalee Beach Resort • Kpakpa Kon, Marshall, Liberia • +231 881 744 350
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleDownloadPdf = (b: any) => {
    if (!b) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Banner
    doc.setFillColor(27, 36, 24);
    doc.rect(0, 0, pageWidth, 105, 'F');
    doc.setTextColor(223, 183, 118);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KWALEE BEACH RESORT • OFFICIAL RESERVATION CONFIRMATION', pageWidth / 2, 36, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('Room Reserved & Booking Confirmed', pageWidth / 2, 66, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Issued: ${b.bookedAt}`, pageWidth / 2, 86, { align: 'center' });

    let y = 135;

    // Reference Box
    doc.setFillColor(250, 247, 238);
    doc.setDrawColor(232, 225, 215);
    doc.roundedRect(40, y, pageWidth - 80, 62, 8, 8, 'FD');
    doc.setTextColor(107, 111, 114);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BOOKING REFERENCE', 56, y + 22);
    doc.text('ASSIGNED UNIT & STATUS', pageWidth - 56, y + 22, { align: 'right' });

    doc.setTextColor(27, 36, 24);
    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    doc.text(String(b.confirmationCode), 56, y + 46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${b.roomNumber} • CONFIRMED`, pageWidth - 56, y + 46, { align: 'right' });

    y += 90;

    // Guest Information
    doc.setTextColor(27, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Guest Information', 40, y);
    y += 10;
    doc.setDrawColor(230, 230, 230);
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    const drawRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 111, 114);
      doc.text(label, 40, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 31, 31);
      doc.text(String(value || '-'), pageWidth - 40, y, { align: 'right' });
      y += 20;
    };

    drawRow('Full Name', b.fullName);
    drawRow('Email Address', b.email);
    drawRow('Phone / WhatsApp Number', b.whatsapp);

    y += 10;
    doc.setTextColor(27, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Stay & Accommodation Details', 40, y);
    y += 10;
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    drawRow('Accommodation', `${b.roomTypeName} (${b.roomsCount} Unit${b.roomsCount > 1 ? 's' : ''})`);
    drawRow('Assigned Unit', b.roomNumber);
    drawRow('Number of Guests', `${b.guests} Guest(s)`);
    drawRow('Check-In Date', `${b.checkIn} (from 2:00 PM)`);
    drawRow('Check-Out Date', `${b.checkOut} (until 11:00 AM)`);
    drawRow('Duration of Stay', `${b.nights} Night(s)`);
    if (b.specialRequests) {
      drawRow('Special Requests', b.specialRequests.slice(0, 80));
    }

    y += 10;
    doc.setTextColor(27, 36, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Charges Summary', 40, y);
    y += 10;
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    drawRow(
      `${b.roomTypeName} (${b.nights} night(s) × ${b.roomsCount} unit(s) @ $${Number(b.roomRate).toFixed(2)})`,
      `$${Number(b.roomSubtotal).toFixed(2)}`
    );

    if (Array.isArray(b.activities) && b.activities.length > 0) {
      b.activities.forEach((act: any) => {
        drawRow(`Activity: ${act.name} (×${act.quantity})`, `$${Number(act.totalPrice).toFixed(2)}`);
      });
    }

    y += 6;
    doc.setFillColor(27, 36, 24);
    doc.roundedRect(40, y, pageWidth - 80, 42, 6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TOTAL BOOKING AMOUNT', 56, y + 26);
    doc.text(`$${Number(b.totalAmount).toFixed(2)}`, pageWidth - 56, y + 26, { align: 'right' });

    y += 70;
    doc.setTextColor(107, 111, 114);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Please present this confirmation PDF or your Booking Reference (${b.confirmationCode}) at the Front Desk upon arrival.`,
      pageWidth / 2,
      y,
      { align: 'center' }
    );
    doc.text(
      'Kwalee Beach Resort • Kpakpa Kon, Marshall, Liberia • +231 881 744 350 • kwaleebeachresort1@gmail.com',
      pageWidth / 2,
      y + 16,
      { align: 'center' }
    );

    doc.save(`Kwalee_Booking_${b.confirmationCode}.pdf`);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const roomCountNumLocal = Math.max(1, parseInt(roomsCount, 10) || 1);
      const specialReqCombined = [
        roomCountNumLocal > 1 ? `[Requested Accommodations: ${roomCountNumLocal} Rooms/Tents]` : '',
        specialRequests.trim(),
        `[Confirmation Preference: ${confirmationPreference.toUpperCase()}]`
      ].filter(Boolean).join('\n');

      const finalWhatsapp = whatsapp.trim() || phone.trim();
      const activeBookedActivities = selectedActivities
        .filter(a => a.quantity > 0)
        .map(sel => {
          const actObj = activities.find(x => x.id === sel.activityId);
          return {
            activityId: sel.activityId,
            name: actObj?.name || 'Activity',
            quantity: sel.quantity,
            totalPrice: Number(actObj?.price || 0) * sel.quantity,
          };
        });

      const payload = {
        firstName,
        lastName,
        email,
        phone,
        whatsapp: finalWhatsapp,
        specialRequests: specialReqCombined,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomTypeId,
        roomsCount: roomCountNumLocal,
        adultsCount: parseInt(guests, 10),
        childrenCount: 0,
        activities: selectedActivities.filter(a => a.quantity > 0),
      };

      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
        const resData = data.data || {};
        const code = resData.confirmationCode || 'RESERVED';
        const cleanRoomName = (resData.roomTypeName || selectedRoom?.name || 'Accommodation')
          .replace(/\s*coming\s*soon\.*/gi, '')
          .trim();

        setConfirmedBooking({
          confirmationCode: code,
          status: resData.status || 'CONFIRMED',
          roomNumber: resData.roomNumber || 'Assigned at Check-In',
          roomTypeName: cleanRoomName,
          roomsCount: roomCountNumLocal,
          guests,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          whatsapp: finalWhatsapp,
          checkIn,
          checkOut,
          nights,
          roomRate: rateNum,
          roomSubtotal: roomStaySubtotal,
          activities: Array.isArray(resData.activities) && resData.activities.length > 0
            ? resData.activities
            : activeBookedActivities,
          totalAmount: Number(resData.totalAmount ?? totalStayPrice),
          specialRequests: specialRequests.trim(),
          bookedAt: new Date().toLocaleString(),
        });
        setIsSuccess(true);

        // Reset form fields for next booking
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setWhatsapp('');
        setSpecialRequests('');
        setSelectedActivities([]);
      } else {
        setError(data.error || 'Failed to submit booking');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section id="booking-bar" className="relative z-20 -mt-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div id="book" className="bg-white shadow-2xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border border-[#E8E1D7]">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 border-b md:border-b-0 md:border-r border-[#E8E1D7] pb-6 md:pb-0 md:pr-6">
            
            {/* Check-in Date */}
            <div className="min-w-0">
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2 truncate">Check-In</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <Calendar size={18} className="text-[#C4A47C] shrink-0" />
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none text-[#1F1F1F] text-xs lg:text-sm font-medium cursor-pointer" 
                />
              </div>
            </div>

            {/* Check-out Date */}
            <div className="min-w-0">
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2 truncate">Check-Out</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <Calendar size={18} className="text-[#C4A47C] shrink-0" />
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none text-[#1F1F1F] text-xs lg:text-sm font-medium cursor-pointer" 
                />
              </div>
            </div>

            {/* Room */}
            <div className="min-w-0">
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2 truncate">Accommodation</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <HomeIcon size={18} className="text-[#C4A47C] shrink-0" />
                <select 
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none text-[#1F1F1F] text-xs lg:text-sm font-medium cursor-pointer truncate"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rooms/Tents Quantity */}
            <div className="min-w-0">
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2 truncate">Rooms / Tents</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <Bed size={18} className="text-[#C4A47C] shrink-0" />
                <select 
                  value={roomsCount}
                  onChange={(e) => setRoomsCount(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none text-[#1F1F1F] text-xs lg:text-sm font-medium cursor-pointer"
                >
                  <option value="1">1 Room / Tent</option>
                  <option value="2">2 Rooms / Tents</option>
                  <option value="3">3 Rooms / Tents</option>
                  <option value="4">4 Rooms / Tents</option>
                  <option value="5">5+ Rooms / Tents</option>
                </select>
              </div>
            </div>

            {/* Guests */}
            <div className="min-w-0">
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2 truncate">Guests</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <Users size={18} className="text-[#C4A47C] shrink-0" />
                <select 
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full min-w-0 bg-transparent outline-none text-[#1F1F1F] text-xs lg:text-sm font-medium cursor-pointer"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5+ Guests</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex-shrink-0">
            <button 
              onClick={handleCheckAvailability}
              className="block w-full px-8 py-5 bg-[#1B2418] text-white uppercase tracking-widest text-sm text-center hover:bg-[#283824] rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* Luxury Booking Modal - Portal to document.body with z-[999999] so header taskbar never overlays it */}
      {isModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E8E1D7] flex flex-col my-auto max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#1B2418] text-white px-6 py-5 flex items-center justify-between shrink-0 border-b border-[#C4A47C]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C4A47C]/20 border border-[#C4A47C]/40 flex items-center justify-center text-[#DFB776]">
                  <Bed size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#DFB776] font-semibold">Kwalee Beach Resort</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-[#DFB776]"></span>
                    <span className="text-[10px] text-white/70">{isSuccess ? 'Official Confirmation' : 'Direct Booking'}</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                    {isSuccess ? 'Room Reserved • Booking Received' : 'Complete Your Reservation'}
                  </h3>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FCFBF7]">
              {isSuccess && confirmedBooking ? (
                <div className="space-y-5 text-left">
                  {/* Top Confirmation Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <CheckCircle size={26} />
                    </div>
                    <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-2">
                      Room Reserved • Booking Received
                    </span>
                    <h4 className="text-2xl font-serif font-bold text-[#1F1F1F] mb-1">
                      You&apos;re Booked, {confirmedBooking.firstName || confirmedBooking.fullName}!
                    </h4>
                    <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                      Your accommodation is reserved. An automatic confirmation has been dispatched to your email (<strong className="text-gray-900">{confirmedBooking.email}</strong>) and WhatsApp (<strong className="text-gray-900">{confirmedBooking.whatsapp}</strong>). You can screenshot, print, or download your PDF confirmation below.
                    </p>
                  </div>

                  {/* Booking Reference Highlight */}
                  <div className="bg-[#1B2418] text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#DFB776] block mb-1">
                        Booking Reference Number
                      </span>
                      <span className="font-mono text-2xl font-extrabold tracking-wider text-white">
                        {confirmedBooking.confirmationCode}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 block mb-1">
                        Assigned Room / Tent
                      </span>
                      <span className="text-sm font-bold text-[#DFB776] bg-white/10 px-3 py-1 rounded-lg inline-block">
                        {confirmedBooking.roomNumber} • CONFIRMED
                      </span>
                    </div>
                  </div>

                  {/* Complete Reservation & Guest Details Card (For Screenshot) */}
                  <div className="bg-white border border-[#E8E1D7] rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="border-b border-[#E8E1D7] pb-3 flex items-center justify-between">
                      <h5 className="text-xs uppercase tracking-widest font-bold text-[#1F1F1F]">
                        Guest & Reservation Details
                      </h5>
                      <span className="text-[11px] text-[#6B6F72]">{confirmedBooking.bookedAt}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Guest Name</span>
                        <span className="font-semibold text-[#1F1F1F]">{confirmedBooking.fullName}</span>
                      </div>
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Phone / WhatsApp</span>
                        <span className="font-semibold text-[#1F1F1F]">{confirmedBooking.whatsapp}</span>
                      </div>
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60 sm:col-span-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Email Address</span>
                        <span className="font-semibold text-[#1F1F1F] break-all">{confirmedBooking.email}</span>
                      </div>
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Accommodation</span>
                        <span className="font-semibold text-[#1F1F1F]">
                          {confirmedBooking.roomTypeName} ({confirmedBooking.roomsCount} {confirmedBooking.roomsCount > 1 ? 'Units' : 'Unit'})
                        </span>
                      </div>
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Guests & Duration</span>
                        <span className="font-semibold text-[#1F1F1F]">
                          {confirmedBooking.guests} Guest(s) • {confirmedBooking.nights} Night(s)
                        </span>
                      </div>
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Check-In Date</span>
                        <span className="font-semibold text-[#1F1F1F]">{confirmedBooking.checkIn} (2:00 PM)</span>
                      </div>
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block">Check-Out Date</span>
                        <span className="font-semibold text-[#1F1F1F]">{confirmedBooking.checkOut} (11:00 AM)</span>
                      </div>
                    </div>

                    {confirmedBooking.specialRequests && (
                      <div className="bg-[#FAF7EE] p-3 rounded-xl border border-[#E8E1D7]/60 text-xs">
                        <span className="text-[10px] uppercase tracking-wider text-[#6B6F72] block mb-0.5">Special Requests</span>
                        <span className="text-[#1F1F1F]">{confirmedBooking.specialRequests}</span>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="border-t border-[#E8E1D7] pt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>
                          {confirmedBooking.roomTypeName} ({confirmedBooking.nights} night{confirmedBooking.nights > 1 ? 's' : ''} × {confirmedBooking.roomsCount} unit{confirmedBooking.roomsCount > 1 ? 's' : ''})
                        </span>
                        <span className="font-semibold">${Number(confirmedBooking.roomSubtotal).toFixed(2)}</span>
                      </div>
                      {Array.isArray(confirmedBooking.activities) &&
                        confirmedBooking.activities.map((act: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-gray-700">
                            <span>Activity: {act.name} (×{act.quantity})</span>
                            <span className="font-semibold">${Number(act.totalPrice).toFixed(2)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between items-center pt-2 border-t border-[#E8E1D7] text-base font-bold text-[#1B2418]">
                        <span>Total Booking Amount</span>
                        <span className="text-lg">${Number(confirmedBooking.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Print / Download PDF / Done Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrintConfirmation(confirmedBooking)}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-[#1B2418] text-[#1B2418] hover:bg-[#1B2418] hover:text-white transition font-bold text-xs uppercase tracking-widest cursor-pointer"
                    >
                      <Printer size={16} />
                      Print Confirmation
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(confirmedBooking)}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#CA9851] hover:bg-[#b58542] text-white transition font-bold text-xs uppercase tracking-widest shadow-md cursor-pointer"
                    >
                      <Download size={16} />
                      Download as PDF
                    </button>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full bg-[#1B2418] text-white py-3.5 rounded-xl hover:bg-[#283824] transition uppercase tracking-widest text-xs font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form id="booking-form-submit" onSubmit={handleSubmitBooking} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
                      {error}
                    </div>
                  )}

                  {/* Select Dates & Accommodation */}
                  <div className="bg-[#FAF7EE] border border-[#E8E1D7] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#CA9851]" />
                        <h4 className="text-xs uppercase tracking-widest font-bold text-[#1F1F1F]">
                          Select Dates & Accommodation
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-[#1B2418] bg-white px-3 py-1 rounded-full border border-[#E8E1D7]">
                        {nights} Night{nights !== 1 ? 's' : ''} • {roomCountNum} {roomCountNum === 1 ? 'Unit' : 'Units'} • Est. ${totalStayPrice}
                      </span>
                    </div>

                    {/* Room Type Selector */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Accommodation</label>
                      <select 
                        value={roomTypeId}
                        onChange={(e) => setRoomTypeId(e.target.value)}
                        className="w-full bg-white border border-[#E8E1D7] rounded-xl p-3 text-sm text-[#1F1F1F] font-medium outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition cursor-pointer"
                      >
                        {roomTypes.map(rt => {
                          const cleanName = (rt.name || '').replace(/\s*coming\s*soon\.*/gi, '').trim();
                          const rate = rt.baseRateUsd ? `$${Number(rt.baseRateUsd).toFixed(0)}/night` : '';
                          return (
                            <option key={rt.id} value={rt.id}>
                              {cleanName} {rate ? `(${rate})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Check-in Date *</label>
                        <input 
                          type="date"
                          required
                          value={checkIn}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl p-2.5 text-xs text-[#1F1F1F] font-medium outline-none focus:border-[#C4A47C] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Check-out Date *</label>
                        <input 
                          type="date"
                          required
                          value={checkOut}
                          min={checkIn || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl p-2.5 text-xs text-[#1F1F1F] font-medium outline-none focus:border-[#C4A47C] transition"
                        />
                      </div>
                    </div>

                    {/* Rooms Quantity & Guests Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Rooms / Tents</label>
                        <div className="relative">
                          <Bed size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CA9851]" />
                          <select 
                            value={roomsCount}
                            onChange={(e) => setRoomsCount(e.target.value)}
                            className="w-full bg-white border border-[#E8E1D7] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1F1F1F] font-medium outline-none focus:border-[#C4A47C] transition cursor-pointer"
                          >
                            <option value="1">1 Room / Tent</option>
                            <option value="2">2 Rooms / Tents</option>
                            <option value="3">3 Rooms / Tents</option>
                            <option value="4">4 Rooms / Tents</option>
                            <option value="5">5+ Rooms / Tents</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total Guests</label>
                        <div className="relative">
                          <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CA9851]" />
                          <select 
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                            className="w-full bg-white border border-[#E8E1D7] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1F1F1F] font-medium outline-none focus:border-[#C4A47C] transition cursor-pointer"
                          >
                            <option value="1">1 Guest</option>
                            <option value="2">2 Guests</option>
                            <option value="3">3 Guests</option>
                            <option value="4">4 Guests</option>
                            <option value="5">5+ Guests</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-[0.15em] font-bold text-[#6B6F72] flex items-center gap-2">
                      <User size={14} className="text-[#C4A47C]" /> Guest Details
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                        <input 
                          required 
                          type="text" 
                          value={firstName} 
                          onChange={e => setFirstName(e.target.value)} 
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl p-3 text-sm text-[#1F1F1F] outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition" 
                          placeholder="e.g. John" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                        <input 
                          required 
                          type="text" 
                          value={lastName} 
                          onChange={e => setLastName(e.target.value)} 
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl p-3 text-sm text-[#1F1F1F] outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition" 
                          placeholder="e.g. Doe" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          required 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl pl-10 pr-3 py-3 text-sm text-[#1F1F1F] outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition" 
                          placeholder="john@example.com" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                            required 
                            type="tel" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            className="w-full bg-white border border-[#E8E1D7] rounded-xl pl-10 pr-3 py-3 text-sm text-[#1F1F1F] outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition" 
                            placeholder="+231..." 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Number (Optional)</label>
                        <input 
                          type="tel" 
                          value={whatsapp} 
                          onChange={e => setWhatsapp(e.target.value)} 
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl p-3 text-sm text-[#1F1F1F] outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition" 
                          placeholder="+231..." 
                        />
                      </div>
                    </div>

                    {/* Confirmation Preference: WhatsApp, Email, or Both */}
                    <div className="bg-white border border-[#E8E1D7] rounded-xl p-4 space-y-2.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6F72]">
                        Preferred Confirmation Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmationPreference('whatsapp')}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            confirmationPreference === 'whatsapp'
                              ? 'bg-[#25D366] text-white border-[#25D366] shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span>💬</span> WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmationPreference('email')}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            confirmationPreference === 'email'
                              ? 'bg-[#1B2418] text-white border-[#1B2418] shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span>✉️</span> Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmationPreference('both')}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            confirmationPreference === 'both'
                              ? 'bg-[#CA9851] text-white border-[#CA9851] shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span>⭐</span> Both
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {confirmationPreference === 'whatsapp' && 'We will send your reservation confirmation to WhatsApp.'}
                        {confirmationPreference === 'email' && 'We will send your reservation confirmation to Email.'}
                        {confirmationPreference === 'both' && 'We will send your confirmation to both WhatsApp and Email.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                      <textarea 
                        value={specialRequests} 
                        onChange={e => setSpecialRequests(e.target.value)} 
                        rows={2}
                        className="w-full bg-white border border-[#E8E1D7] rounded-xl p-3 text-sm text-[#1F1F1F] outline-none focus:border-[#C4A47C] focus:ring-2 focus:ring-[#C4A47C]/20 transition resize-none" 
                        placeholder="Arrival time, dietary preferences, ocean view preference..." 
                      />
                    </div>
                  </div>

                  {/* Add-on Experiences */}
                  {activities.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs uppercase tracking-[0.15em] font-bold text-[#6B6F72] flex items-center gap-2">
                        <Sparkles size={14} className="text-[#C4A47C]" /> Add Resort Activities (Optional)
                      </h4>
                      <div className="space-y-2">
                        {activities.map(act => {
                          const selected = selectedActivities.find(a => a.activityId === act.id);
                          const qty = selected ? selected.quantity : 0;
                          return (
                            <div key={act.id} className="flex justify-between items-center bg-white border border-[#E8E1D7] p-3 rounded-xl">
                              <div>
                                <p className="text-sm font-medium text-[#1F1F1F]">{act.name}</p>
                                <span className="text-xs font-semibold text-[#C4A47C]">${Number(act.price).toFixed(2)} / guest</span>
                              </div>
                              <div className="flex items-center gap-2 bg-[#FAF7EE] border border-[#E8E1D7] rounded-lg p-1">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (qty > 0) {
                                      setSelectedActivities(prev => prev.map(p => p.activityId === act.id ? { ...p, quantity: p.quantity - 1 } : p));
                                    }
                                  }} 
                                  className="w-7 h-7 rounded bg-white border border-[#E8E1D7] flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition"
                                >-</button>
                                <span className="text-xs font-bold w-6 text-center">{qty}</span>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (qty === 0) {
                                      setSelectedActivities([...selectedActivities, { activityId: act.id, quantity: 1 }]);
                                    } else {
                                      setSelectedActivities(prev => prev.map(p => p.activityId === act.id ? { ...p, quantity: p.quantity + 1 } : p));
                                    }
                                  }} 
                                  className="w-7 h-7 rounded bg-white border border-[#E8E1D7] flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 transition"
                                >+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Modal Footer */}
            {!isSuccess && (
              <div className="bg-white p-5 border-t border-[#E8E1D7] shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-center text-center gap-2 text-xs text-[#6B6F72] px-2 leading-relaxed">
                  <ShieldCheck size={16} className="text-[#CA9851] shrink-0" />
                  <span>No immediate payment is required • Pay via Mobile Money or other payment method recommended by the resort</span>
                </div>
                <button 
                  type="submit" 
                  form="booking-form-submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#1B2418] hover:bg-[#283824] text-white font-serif tracking-widest uppercase text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting Reservation...' : 'Confirm Reservation Request'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
