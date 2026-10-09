"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Home as HomeIcon, X, CheckCircle } from 'lucide-react';

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
      const payload = {
        firstName,
        lastName,
        email,
        phone,
          whatsapp,
          specialRequests,
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
        router.push('/booking/' + data.data.confirmationCode);
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

  return (
    <>
      <section id="book" className="relative z-20 -mt-16 max-w-6xl mx-auto px-6">
        <div className="bg-white shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 border-b md:border-b-0 md:border-r border-[#E8E1D7] pb-6 md:pb-0 md:pr-6">
            
            {/* Dates */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72]/80 mb-2">Check-in — Check-out</label>
              <div className="flex items-center gap-2 border-b border-[#1F1F1F] py-2">
                <Calendar size={18} className="text-[#6B6F72]/80 shrink-0" />
                <input 
                  type="date" 
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F] text-sm" 
                />
                <span className="text-[#6B6F72]/80">-</span>
                <input 
                  type="date" 
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F] text-sm" 
                />
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72]/80 mb-2">Guests</label>
              <div className="flex items-center gap-3 border-b border-[#1F1F1F] py-2">
                <Users size={18} className="text-[#6B6F72]/80" />
                <select 
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F]"
                >
                  <option value="1">1 Adult</option>
                  <option value="2">2 Adults</option>
                  <option value="3">3 Adults</option>
                  <option value="4">4 Adults</option>
                </select>
              </div>
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6B6F72]/80 mb-2">Accommodation</label>
              <div className="flex items-center gap-3 border-b border-[#1F1F1F] py-2">
                <HomeIcon size={18} className="text-[#6B6F72]/80" />
                <select 
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#1F1F1F]"
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
              className="block w-full px-8 py-5 bg-[#1B2418] text-white uppercase tracking-widest text-sm text-center hover:bg-[#2B4B5C] transition-colors cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-serif font-bold text-gray-900">Complete Your Booking</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6F72]/80 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Booking Requested!</h4>
                  <p className="text-gray-600 mb-6">
                    Thank you for your reservation. Our team will review it and contact you shortly to confirm.
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-[#1B2418] text-white px-8 py-3 rounded hover:bg-gray-800 transition"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                      <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#F5A623]" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                      <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#F5A623]" placeholder="Doe" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#F5A623]" placeholder="john@example.com" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                    <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#F5A623]" placeholder="+1 234 567 8900" />
                  </div>

                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Number (Optional)</label>
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#F5A623]" placeholder="+1 234 567 8900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Special Requests</label>
                    <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#F5A623] resize-none h-16" placeholder="Any special needs..."></textarea>
                  </div>
                    {activities.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enhance Your Stay (Optional)</label>
                        <div className="space-y-3">
                          {activities.map(act => {
                            const selected = selectedActivities.find(a => a.activityId === act.id);
                            const qty = selected ? selected.quantity : 0;
                            return (
                              <div key={act.id} className="flex justify-between items-center border border-gray-200 p-3 rounded">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{act.name} <span className="text-xs text-[#F5A623] ml-1">${Number(act.price).toFixed(2)}</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => {
                                    if (qty > 0) {
                                      setSelectedActivities(prev => prev.map(p => p.activityId === act.id ? { ...p, quantity: p.quantity - 1 } : p));
                                    }
                                  }} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">-</button>
                                  <span className="text-sm w-4 text-center">{qty}</span>
                                  <button type="button" onClick={() => {
                                    if (qty === 0) {
                                      setSelectedActivities([...selectedActivities, { activityId: act.id, quantity: 1 }]);
                                    } else {
                                      setSelectedActivities(prev => prev.map(p => p.activityId === act.id ? { ...p, quantity: p.quantity + 1 } : p));
                                    }
                                  }} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

<div className="bg-gray-50 p-4 rounded text-sm text-gray-600 mt-6 border border-gray-100">
                    <p><strong>Check-in:</strong> {checkIn}</p>
                    <p><strong>Check-out:</strong> {checkOut}</p>
                    <p><strong>Guests:</strong> {guests} Adult{guests !== '1' ? 's' : ''}</p>
                    <p><strong>Room:</strong> {roomTypes.find(r => r.id === roomTypeId)?.name || 'Standard'}</p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#F5A623] text-white font-bold py-3 rounded mt-4 hover:bg-[#D08C1D] transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
