"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Home as HomeIcon, X, CheckCircle, Bed, Sparkles, Phone, Mail, User, ShieldCheck } from 'lucide-react';

export const BookingBarInteractive = () => {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');
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

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckIn(today.toISOString().split('T')[0]);
    setCheckOut(tomorrow.toISOString().split('T')[0]);
    
    // Fetch room types
    fetch('/api/booking')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setRoomTypes(data.data);
          setRoomTypeId(data.data[0].id);
        } else {
          // Fallback to public endpoint
          fetch('/api/v1/public/room-types')
            .then(r => r.json())
            .then(d => {
              if (d.data && d.data.length > 0) {
                setRoomTypes(d.data);
                setRoomTypeId(d.data[0].id);
              }
            });
        }
      })
      .catch(err => console.error('Failed to fetch room types', err));

    // Fetch activities
    fetch('/api/activities')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setActivities(data.data);
        }
      })
      .catch(err => console.error('Failed to fetch activities', err));

    const handleOpenBooking = (e: any) => {
      if (e.detail?.roomTypeId) {
        setRoomTypeId(e.detail.roomTypeId);
      }
      setIsModalOpen(true);
      setIsSuccess(false);
      setError('');
    };

    window.addEventListener('open-booking-modal', handleOpenBooking);
    return () => window.removeEventListener('open-booking-modal', handleOpenBooking);
  }, []);

  const handleCheckAvailability = () => {
    setIsModalOpen(true);
    setIsSuccess(false);
    setError('');
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const specialReqCombined = [
        specialRequests.trim(),
        `[Confirmation Preference: ${confirmationPreference.toUpperCase()}]`
      ].filter(Boolean).join('\n');

      const finalWhatsapp = whatsapp.trim() || (confirmationPreference !== 'email' ? phone.trim() : '');

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
        setIsSuccess(true);
        if (data.data?.confirmationCode) {
          router.push('/booking/' + data.data.confirmationCode);
        }
        // Reset form
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
      } else {
        setError(data.error || 'Failed to submit booking');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoom = roomTypes.find(r => r.id === roomTypeId);
  const nights = Math.max(1, Math.round((new Date(checkOut || Date.now()).getTime() - new Date(checkIn || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) || 1);
  const rateNum = selectedRoom?.baseRateUsd ? Number(selectedRoom.baseRateUsd) : (selectedRoom?.price ? Number(String(selectedRoom.price).replace(/[^0-9.]/g, '')) : 35);
  const totalStayPrice = (rateNum * nights).toFixed(0);

  return (
    <>
      <section id="booking-bar" className="relative z-20 -mt-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div id="book" className="bg-white shadow-2xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border border-[#E8E1D7]">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 border-b md:border-b-0 md:border-r border-[#E8E1D7] pb-6 md:pb-0 md:pr-6">
            
            {/* Dates */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2">Check-in — Check-out</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <Calendar size={18} className="text-[#C4A47C] shrink-0" />
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F] text-sm font-medium" 
                />
                <span className="text-[#6B6F72]">-</span>
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F] text-sm font-medium" 
                />
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2">Guests</label>
              <div className="flex items-center gap-3 border-b border-[#1F1F1F] py-2">
                <Users size={18} className="text-[#C4A47C] shrink-0" />
                <select 
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F] text-sm font-medium cursor-pointer"
                >
                  <option value="1">1 Adult</option>
                  <option value="2">2 Adults</option>
                  <option value="3">3 Adults</option>
                  <option value="4">4 Adults</option>
                  <option value="5">5+ Adults</option>
                </select>
              </div>
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72] font-semibold mb-2">Accommodation</label>
              <div className="flex items-center gap-3 border-b border-[#1F1F1F] py-2">
                <HomeIcon size={18} className="text-[#C4A47C] shrink-0" />
                <select 
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F] text-sm font-medium cursor-pointer"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
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

      {/* Luxury Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
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
                    <span className="text-[10px] text-white/70">Direct Booking</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white tracking-wide">Complete Your Reservation</h3>
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
              {isSuccess ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle size={36} />
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-gray-900 mb-2">Reservation Requested!</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                    Thank you for choosing Kwalee Beach Resort. Our guest services team has received your details and will contact you via WhatsApp / Email shortly to confirm.
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-[#1B2418] text-white px-8 py-3.5 rounded-xl hover:bg-[#283824] transition uppercase tracking-widest text-xs font-semibold"
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
                        {nights} Night{nights !== 1 ? 's' : ''} • Est. ${totalStayPrice}
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

                    {/* Dates & Guests Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Guests</label>
                        <select 
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                          className="w-full bg-white border border-[#E8E1D7] rounded-xl p-2.5 text-xs text-[#1F1F1F] font-medium outline-none focus:border-[#C4A47C] transition cursor-pointer"
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
                <div className="flex items-center justify-center gap-2 text-xs text-[#6B6F72]">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>No immediate payment required • Pay on arrival or via Mobile Money</span>
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
        </div>
      )}
    </>
  );
};
