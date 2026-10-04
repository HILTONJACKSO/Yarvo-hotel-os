"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import Image from 'next/image';
import { Calendar, Users, MapPin, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/toast-provider';

export default function EventsPage() {
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);

  useEffect(() => {
    async function fetchSpaces() {
      try {
        const res = await fetch('/api/v1/public/event-spaces', {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef',
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEventSpaces(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch event spaces:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSpaces();
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <Image 
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80"
          alt="Events & Weddings"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Host Your Event</h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">
            Weddings, corporate retreats, and private celebrations by the ocean.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-24">
        
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-[#1A1A1A] mb-4">Our Venues</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the perfect setting for your next unforgettable gathering.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A]"></div></div>
        ) : eventSpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {eventSpaces.map(space => (
              <div key={space.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                  <Image 
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80" // Fallback event space image
                    alt={space.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                    <span className="font-bold text-[#1A1A1A]">${Number(space.pricePerHour).toFixed(2)}</span>
                    <span className="text-sm text-gray-600"> / hr</span>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="font-serif text-2xl text-[#1A1A1A] mb-4">{space.name}</h3>
                  
                  <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>Up to {space.capacity} Guests</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => {
                        setSelectedSpace(space);
                        setTimeout(() => {
                          document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="w-full py-3 text-center border-2 border-[#1A1A1A] text-[#1A1A1A] font-medium rounded-full hover:bg-[#1A1A1A] hover:text-white transition-colors uppercase tracking-widest text-sm"
                    >
                      Book Venue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mb-24">No event spaces available right now.</p>
        )}

        {/* Booking Form Section */}
        {selectedSpace && (
          <div id="booking-form" className="max-w-3xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
            <h2 className="font-serif text-3xl text-[#1A1A1A] mb-2">Book {selectedSpace.name}</h2>
            <p className="text-gray-500 mb-8">Fill out the details below and our events team will get back to you shortly.</p>
            
            <EventBookingForm spaceId={selectedSpace.id} onSuccess={() => setSelectedSpace(null)} />
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}

function EventBookingForm({ spaceId, onSuccess }: { spaceId: string, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      spaceId,
      guestName: formData.get('guestName'),
      guestEmail: formData.get('guestEmail'),
      guestPhone: formData.get('guestPhone'),
      eventType: formData.get('eventType'),
      attendeesCount: Number(formData.get('attendeesCount')),
      startTime: new Date(formData.get('date') as string + 'T' + formData.get('startTime') + ':00').toISOString(),
      endTime: new Date(formData.get('date') as string + 'T' + formData.get('endTime') + ':00').toISOString(),
      specialRequests: formData.get('specialRequests'),
    };

    try {
      const res = await fetch('/api/v1/public/event-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({
          title: "Booking Submitted",
          description: "Your event inquiry has been sent successfully!",
          variant: "default",
        });
        e.currentTarget.reset();
        onSuccess();
      } else {
        const err = await res.json();
        toast({
          title: "Booking Failed",
          description: err.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Network error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input required name="guestName" type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input required name="guestEmail" type="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input required name="guestPhone" type="tel" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
          <select required name="eventType" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] bg-white">
            <option value="Wedding">Wedding</option>
            <option value="Corporate Meeting">Corporate Meeting</option>
            <option value="Birthday Party">Birthday Party</option>
            <option value="Private Dinner">Private Dinner</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
          <input required name="attendeesCount" type="number" min="1" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
          <input required name="date" type="date" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
          <input required name="startTime" type="time" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
          <input required name="endTime" type="time" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests or Details</label>
        <textarea name="specialRequests" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"></textarea>
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-4 bg-[#1A1A1A] text-white font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
      </button>
    </form>
  );
}
