"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Compass, Users } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';

import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';
import { WebsiteContent } from '@/types/cms';

const getActivityFallbackImage = (name: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('wildlife') || n.includes('libassa') || n.includes('safari') || n.includes('zoo')) {
    return 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('boat') || n.includes('cruise') || n.includes('lagoon') || n.includes('kayak')) {
    return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('surf') || n.includes('beach') || n.includes('ocean')) {
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800';
  }
  if (n.includes('quad') || n.includes('atv') || n.includes('bike')) {
    return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800';
  }
  return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800';
};

const formatActivityPrice = (activity: any): string => {
  const price = Number(activity?.price || 0);
  if (price > 0) return `$${price.toFixed(2)} / guest`;
  return 'Inquire for Custom Quote';
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
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

    async function fetchActivities() {
      try {
        let list: any[] = [];
        const res = await fetch('/api/activities', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const raw = data?.data ?? data;
          list = Array.isArray(raw) ? raw : [];
        } else {
          const fallbackRes = await fetch('/api/v1/public/activities', {
            headers: { 'X-API-Key': 'yarvo_pub_test_1234567890abcdef' },
          });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const raw = data?.data ?? data;
            list = Array.isArray(raw) ? raw : [];
          }
        }
        setActivities(list);
      } catch (err) {
        console.error('Failed to fetch HMS activities:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);

  const pageData = cmsContent.subpages.tours || DEFAULT_CMS_CONTENT.subpages.tours;
  const whatsappDigits = (cmsContent.general.whatsappNumber || "+231774340843").replace(/[^0-9]/g, '');

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Navbar general={cmsContent.general} />

      {/* Hero Section (duplicated from Events layout) */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <img
          src={pageData.bgImage || DEFAULT_CMS_CONTENT.subpages.tours.bgImage}
          alt={pageData.title || "Resort Activities & Tours"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          {pageData.badge && (
            <span className="text-xs uppercase tracking-[0.2em] text-[#E8E1D7] block mb-3 font-semibold">
              {pageData.badge}
            </span>
          )}
          <h1 className="font-serif text-5xl md:text-7xl mb-6">
            {pageData.title || "Resort Activities & Tours"}
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">
            {pageData.description || "Explore the breathtaking Liberian coast, wildlife excursions, boat cruises, and guided resort activities."}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#F5A623] mb-3 block">
            Official Offerings
          </span>
          <h2 className="font-serif text-4xl text-[#1F1F1F] mb-4">Our Activities & Excursions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our curated coastal excursions, guided wildlife tours, and signature resort activities pulled directly from our HMS Activities system.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F1F1F]"></div>
          </div>
        ) : activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {activities.map(act => {
              const rawOverride =
                cmsContent.events?.spaceImages?.[act.id] ??
                cmsContent.events?.spaceImages?.[act.name];
              const isRemoved = rawOverride === 'NONE';
              const primaryHmsImg =
                act.image || (Array.isArray(act.images) && act.images.length > 0 ? act.images[0] : '');
              const activityImg = isRemoved
                ? ''
                : (rawOverride || primaryHmsImg || getActivityFallbackImage(act.name));
              const priceText = formatActivityPrice(act);
              const description =
                act.description && act.description.trim().length > 0
                  ? act.description
                  : `Enjoy an unforgettable guided ${act.name} experience with our resort hospitality team.`;
              const waText = `Hello Kwalee Beach Resort! I would like to book or inquire about the ${act.name.trim()} activity (${priceText}). Please share details and availability!`;

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                >
                  {activityImg ? (
                    <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                      <img
                        src={activityImg}
                        alt={act.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md text-xs font-bold text-[#1F1F1F]">
                        {priceText}
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-24 bg-[#1B2418] flex items-center justify-between px-6">
                      <span className="text-xs uppercase tracking-[0.2em] text-[#F5A623] font-semibold">
                        {act.type || 'Activity'}
                      </span>
                      <div className="bg-white/95 px-4 py-1.5 rounded-full shadow-md text-xs font-bold text-[#1F1F1F]">
                        {priceText}
                      </div>
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="font-serif text-2xl text-[#1F1F1F] mb-2">{act.name}</h3>

                    <div className="flex items-center gap-4 text-[#6B6F72] text-sm mb-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Compass size={16} className="text-[#C4A47C]" />
                        <span className="uppercase tracking-wider text-xs font-semibold">
                          {act.type || 'Resort Activity'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users size={16} className="text-[#C4A47C]" />
                        <span>Per Guest / Group</span>
                      </div>
                    </div>

                    <p className="text-sm text-[#6B6F72] leading-relaxed mb-6 flex-grow">
                      {description}
                    </p>

                    <div className="mt-auto space-y-2.5">
                      <button
                        onClick={() => {
                          setSelectedActivity(act);
                          setTimeout(() => {
                            document
                              .getElementById('activity-booking-form')
                              ?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="w-full py-3.5 text-center bg-[#1B2418] text-white font-medium rounded-xl hover:bg-[#283824] transition-colors uppercase tracking-widest text-xs font-bold cursor-pointer"
                      >
                        Book Activity
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
          <p className="text-center text-[#6B6F72] mb-24">
            No activities or tours are available right now.
          </p>
        )}

        {/* Activity Booking Form Section */}
        {selectedActivity && (
          <div
            id="activity-booking-form"
            className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#F5A623] block mb-1">
                  Activity Reservation Request
                </span>
                <h2 className="font-serif text-3xl text-[#1F1F1F] mb-1">
                  Book {selectedActivity.name}
                </h2>
                <p className="text-sm text-[#6B6F72]">
                  {formatActivityPrice(selectedActivity)} • {selectedActivity.type || 'Resort Activity'}
                </p>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold uppercase tracking-wider"
              >
                Close ✕
              </button>
            </div>

            <ActivityBookingForm
              activity={selectedActivity}
              onSuccess={() => setSelectedActivity(null)}
            />
          </div>
        )}
      </div>

      <Footer general={cmsContent.general} />
    </main>
  );
}

function ActivityBookingForm({
  activity,
  onSuccess,
}: {
  activity: any;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestsCount, setGuestsCount] = useState(2);
  const { showToast } = useToast();
  const unitPrice = Number(activity?.price || 0);
  const estimatedTotal = unitPrice * Math.max(1, guestsCount);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const guestEmailRaw = (formData.get('guestEmail') as string)?.trim();
    const dateStr = (formData.get('date') as string) || new Date().toISOString().split('T')[0];
    const startTimeStr = (formData.get('startTime') as string) || '10:00';
    const endTimeStr = (formData.get('endTime') as string) || '14:00';

    const data: any = {
      spaceId: activity.id,
      guestName: (formData.get('guestName') as string)?.trim() || 'Guest',
      guestPhone: (formData.get('guestPhone') as string)?.trim() || '',
      eventType: `Activity: ${activity.name}`,
      attendeesCount: Number(formData.get('attendeesCount') || guestsCount || 1),
      startTime: new Date(`${dateStr}T${startTimeStr}:00`).toISOString(),
      endTime: new Date(`${dateStr}T${endTimeStr}:00`).toISOString(),
      specialRequests: (formData.get('specialRequests') as string)?.trim() || '',
    };
    if (guestEmailRaw && guestEmailRaw.length > 0) {
      data.guestEmail = guestEmailRaw;
    }

    try {
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
            'X-API-Key': 'yarvo_pub_test_1234567890abcdef',
          },
          body: JSON.stringify(data),
        });
      }

      if (res.ok) {
        showToast(
          `Your booking request for ${activity.name} has been received!`,
          'success',
          'Activity Booked'
        );
        e.currentTarget.reset();
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to submit activity booking.', 'error', 'Booking Failed');
      }
    } catch (err) {
      console.error(err);
      showToast('A network error occurred. Please try again.', 'error', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            required
            name="guestName"
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone / WhatsApp Number
          </label>
          <input
            required
            name="guestPhone"
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white"
            placeholder="+231..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address (Optional)
          </label>
          <input
            name="guestEmail"
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
          <input
            required
            name="attendeesCount"
            type="number"
            min="1"
            max="100"
            value={guestsCount}
            onChange={e => setGuestsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
          <input
            required
            name="date"
            type="date"
            style={{ colorScheme: 'light' }}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white font-medium"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
          <input
            required
            name="startTime"
            type="time"
            defaultValue="10:00"
            style={{ colorScheme: 'light' }}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] text-gray-900 bg-white font-medium cursor-pointer"
          />
          <input type="hidden" name="endTime" value="16:00" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Activity & Total Estimate
          </label>
          <input
            disabled
            value={`${activity.name} (${formatActivityPrice(activity)}) — Total for ${guestsCount} guest(s): $${estimatedTotal.toFixed(2)}`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 font-semibold"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests or Notes
        </label>
        <textarea
          name="specialRequests"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2418] resize-none text-gray-900 bg-white"
          placeholder="Pickup instructions, group details, or special preferences..."
        ></textarea>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-[#1B2418] text-white font-serif tracking-widest uppercase text-xs font-bold rounded-xl hover:bg-[#283824] transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
      >
        {isSubmitting ? 'Submitting Activity Booking...' : 'Confirm Activity Booking'}
      </button>
    </form>
  );
}
