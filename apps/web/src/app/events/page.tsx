"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Image from 'next/image';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';
import { WebsiteContent } from '@/types/cms';

const getEventImage = (eventName: string): string => {
  const n = (eventName || '').toLowerCase();
  if (n.includes('heartshape') || (n.includes('beach') && n.includes('dinner'))) {
    return 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('poolside')) {
    return 'https://images.unsplash.com/photo-1576013462273-d1a460851ec0?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('jazz')) {
    return 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('karaoke')) {
    return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('movie')) {
    return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('bonfire')) {
    return 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('dinner')) {
    return 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800';
  }
  return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800';
};

const formatEventPrice = (space: any): string => {
  const perDay = Number(space.pricePerDay || 0);
  const perHour = Number(space.pricePerHour || 0);
  if (perDay > 0 && perHour > 0) return `$${perHour}/hr • $${perDay}/pkg`;
  if (perDay > 0) return `$${perDay} / package`;
  if (perHour > 0) return `$${perHour} / hr`;
  return 'Inquire for Custom Quote';
};

const getEventDescription = (name: string, capacity: number): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('heartshape')) return 'An unforgettable private candlelit dinner set directly on the pristine beach inside a romantic heart-shaped floral display. Perfect for proposals and anniversaries.';
  if (n.includes('poolside')) return 'An enchanting private evening dinner table set right beside our illuminated resort pool, complete with candlelight and custom culinary service.';
  if (n.includes('jazz')) return 'Smooth live coastal jazz under the stars with signature cocktails, ambient ocean lighting, and reserved lounge seating for your group.';
  if (n.includes('karaoke')) return 'High-energy beachfront party night featuring professional sound, open mic karaoke, beach lounge setup, and drink specials.';
  if (n.includes('movie')) return 'Private starlight open-air cinema under the palm trees. Enjoy movie projections on the big screen with plush seating and popcorn.';
  if (n.includes('bonfire')) return 'Cozy beach bonfire experience surrounded by ocean waves, acoustic music, marshmallows, and coastal warmth under the night sky.';
  if (n.includes('dinner party')) return 'Full-service dining banquet for up to 30 guests, tailored for birthdays, corporate achievements, and festive celebrations.';
  return `Host an unforgettable event for up to ${capacity} guests with dedicated coastal hospitality and tailored arrangements.`;
};

export default function EventsPage() {
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(DEFAULT_CMS_CONTENT);

  useEffect(() => {
    fetch('/api/cms', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCmsContent(mergeWithDefaultContent(json.data));
        }
      })
      .catch(() => {});

    async function fetchSpaces() {
      try {
        let spaces: any[] = [];
        const res = await fetch('/api/event-spaces', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          spaces = data.data || [];
        } else {
          const fallbackRes = await fetch('/api/v1/public/event-spaces');
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            spaces = data.data || [];
          }
        }
        setEventSpaces(spaces);
      } catch (err) {
        console.error('Failed to fetch event spaces:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSpaces();
  }, []);

  const eventData = cmsContent.subpages.events || DEFAULT_CMS_CONTENT.subpages.events;
  const whatsappDigits = (cmsContent.general.whatsappNumber || "+231774340843").replace(/[^0-9]/g, '');

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Navbar general={cmsContent.general} />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <img 
          src={eventData.bgImage || DEFAULT_CMS_CONTENT.subpages.events.bgImage}
          alt={eventData.title || "Events & Experiences"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          {eventData.badge && (
            <span className="text-xs uppercase tracking-[0.2em] text-[#E8E1D7] block mb-3 font-semibold">
              {eventData.badge}
            </span>
          )}
          <h1 className="font-serif text-5xl md:text-7xl mb-6">{eventData.title || "Event Spaces & Experiences"}</h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">
            {eventData.description || "Romantic beach dinners, live jazz, karaoke, starlight movie nights, and celebrations."}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-24">
        
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#F5A623] mb-3 block">Official Offerings</span>
          <h2 className="font-serif text-4xl text-[#1F1F1F] mb-4">Our Event Spaces & Packages</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our signature coastal celebrations and event venues, pulled directly from our resort booking system.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F1F1F]"></div></div>
        ) : eventSpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {eventSpaces.map(space => {
              const eventImg = cmsContent.events?.spaceImages?.[space.id] || cmsContent.events?.spaceImages?.[space.name] || space.image || getEventImage(space.name);
              const priceText = formatEventPrice(space);
              const description = getEventDescription(space.name, space.capacity);
              const waText = `Hello Kwalee Beach Resort! I would like to inquire about booking the ${space.name.trim()} (${priceText}, up to ${space.capacity} guests). Please send availability!`;

              return (
                <div key={space.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group">
                  <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                    <img 
                      src={eventImg} 
                      alt={space.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md text-xs font-bold text-[#1F1F1F]">
                      {priceText}
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="font-serif text-2xl text-[#1F1F1F] mb-2">{space.name}</h3>
                    
                    <div className="flex items-center gap-4 text-[#6B6F72] text-sm mb-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users size={16} className="text-[#C4A47C]" />
                        <span>Up to {space.capacity} Guests</span>
                      </div>
                    </div>

                    <p className="text-sm text-[#6B6F72] leading-relaxed mb-6 flex-grow">
                      {description}
                    </p>

                    <div className="mt-auto space-y-2.5">
                      <button 
                        onClick={() => {
                          setSelectedSpace(space);
                          setTimeout(() => {
                            document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="w-full py-3.5 text-center bg-[#1B2418] text-white font-medium rounded-xl hover:bg-[#283824] transition-colors uppercase tracking-widest text-xs font-bold cursor-pointer"
                      >
                        Book Event Space
                      </button>
                      <a 
                        href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 text-center border border-[#25D366] text-[#1B2418] hover:bg-[#25D366] hover:text-white rounded-xl flex items-center justify-center gap-2 transition-colors text-xs font-bold tracking-wider uppercase cursor-pointer"
                      >
                        <span>💬</span> Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-[#6B6F72] mb-24">No event spaces available right now.</p>
        )}

        {/* Booking Form Section */}
        {selectedSpace && (
          <div id="booking-form" className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#F5A623] block mb-1">Reservation Request</span>
                <h2 className="font-serif text-3xl text-[#1F1F1F] mb-1">Book {selectedSpace.name}</h2>
                <p className="text-sm text-[#6B6F72]">
                  {formatEventPrice(selectedSpace)} • Up to {selectedSpace.capacity} Guests
                </p>
              </div>
              <button 
                onClick={() => setSelectedSpace(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold uppercase tracking-wider"
              >
                Close ✕
              </button>
            </div>
            
            <EventBookingForm space={selectedSpace} onSuccess={() => setSelectedSpace(null)} />
          </div>
        )}

      </div>

      <Footer general={cmsContent.general} />
    </main>
  );
}

function EventBookingForm({ space, onSuccess }: { space: any, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const guestEmailRaw = (formData.get('guestEmail') as string)?.trim();
    const data: any = {
      spaceId: space.id,
      guestName: (formData.get('guestName') as string)?.trim() || 'Guest',
      guestPhone: (formData.get('guestPhone') as string)?.trim() || '',
      eventType: space.name || formData.get('eventType') || 'Event Package',
      attendeesCount: Number(formData.get('attendeesCount') || space.capacity || 2),
      startTime: new Date(formData.get('date') as string + 'T' + formData.get('startTime') + ':00').toISOString(),
      endTime: new Date(formData.get('date') as string + 'T' + formData.get('endTime') + ':00').toISOString(),
      specialRequests: (formData.get('specialRequests') as string)?.trim() || '',
    };
    if (guestEmailRaw && guestEmailRaw.length > 0) {
      data.guestEmail = guestEmailRaw;
    }

    try {
      // First try internal server route proxy, fallback to direct API
      let res = await fetch('/api/event-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        res = await fetch('/api/v1/public/event-bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'kwalee_pub_key_default',
          },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        showToast("Your event booking request has been sent successfully!", "success", "Booking Submitted");
        e.currentTarget.reset();
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || "Failed to submit booking.", "error", "Booking Failed");
      }
    } catch (err) {
      console.error(err);
      showToast("A network error occurred. Please try again.", "error", "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input required name="guestName" type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone / WhatsApp Number</label>
          <input required name="guestPhone" type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white" placeholder="+231..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address (Optional)</label>
          <input name="guestEmail" type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white" placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Number of Guests</label>
          <input required name="attendeesCount" type="number" min="1" max={space.capacity * 2} defaultValue={Math.min(space.capacity, 2)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
          <input required name="date" type="date" style={{ colorScheme: 'light' }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white font-medium" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
          <input required name="startTime" type="time" defaultValue="18:00" style={{ colorScheme: 'light' }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white font-medium cursor-pointer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
          <input required name="endTime" type="time" defaultValue="22:00" style={{ colorScheme: 'light' }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white font-medium cursor-pointer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Selected Package</label>
          <input disabled value={`${space.name} (${formatEventPrice(space)})`} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 font-semibold" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests or Culinary Preferences</label>
        <textarea name="specialRequests" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] resize-none" placeholder="Dietary requests, special setup, anniversary message, etc."></textarea>
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-4 bg-[#1B2418] text-white font-serif tracking-widest uppercase text-xs font-bold rounded-xl hover:bg-[#283824] transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
      >
        {isSubmitting ? 'Submitting Reservation Request...' : 'Confirm Event Request'}
      </button>
    </form>
  );
}
