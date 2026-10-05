"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Image from 'next/image';
import { Bed, Users, Wifi, Wind, Tv, Coffee } from 'lucide-react';
import { BookingBarInteractive } from '@/components/landing/BookingBarInteractive';

export default function StayPage() {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRoomTypes() {
      try {
        const res = await fetch('/api/v1/public/room-types', {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef',
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRoomTypes(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch room types:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRoomTypes();
  }, []);

  // Split into tents and standard rooms based on name/code
  const tents = roomTypes.filter(rt => rt.name.toLowerCase().includes('tent') || rt.code.toLowerCase().includes('tnt'));
  const rooms = roomTypes.filter(rt => !rt.name.toLowerCase().includes('tent') && !rt.code.toLowerCase().includes('tnt'));

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <Image 
          src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80"
          alt="Luxury Accommodation"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Stay With Us</h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">
            Experience unparalleled luxury in our oceanfront rooms and glamping tents.
          </p>
        </div>
      </section>

      {/* Booking Bar */}
      <div className="relative z-20 -mt-16 w-full max-w-6xl mx-auto px-4">
        <BookingBarInteractive />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-24 space-y-32">
        {/* Rooms Section */}
        <section>
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#1F1F1F] mb-4">Luxury Rooms & Suites</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Wake up to the sound of waves in our meticulously designed rooms, offering breathtaking views and premium amenities.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F1F1F]"></div></div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map(room => <RoomCard key={room.id} room={room} />)}
            </div>
          ) : (
            <p className="text-center text-[#6B6F72]">No rooms available at the moment.</p>
          )}
        </section>

        {/* Tents Section */}
        <section>
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#1F1F1F] mb-4">Glamping Tents</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Immerse yourself in nature without sacrificing comfort in our premium beachfront tents.
            </p>
          </div>

          {isLoading ? (
             <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F1F1F]"></div></div>
          ) : tents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {tents.map(tent => <RoomCard key={tent.id} room={tent} isLarge />)}
            </div>
          ) : (
            <p className="text-center text-[#6B6F72]">No tents available at the moment.</p>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

function RoomCard({ room, isLarge = false }: { room: any, isLarge?: boolean }) {
  // Use first image or fallback
  let imageUrl = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80';
  if (room.images && Array.isArray(room.images) && room.images.length > 0) {
    imageUrl = room.images[0];
    if (!imageUrl.startsWith('http')) {
      imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${imageUrl}`;
    }
  }

  // Parse amenities if it's a string or array
  let parsedAmenities: string[] = [];
  try {
    if (typeof room.amenities === 'string') {
      parsedAmenities = JSON.parse(room.amenities);
    } else if (Array.isArray(room.amenities)) {
      parsedAmenities = room.amenities;
    }
  } catch(e) {}

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      <div className={`relative w-full ${isLarge ? 'h-80' : 'h-64'} overflow-hidden`}>
        <Image 
          src={imageUrl}
          alt={room.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <span className="font-bold text-[#1F1F1F]">${Number(room.baseRateUsd).toFixed(2)}</span>
          <span className="text-sm text-gray-600"> / night</span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl text-[#1F1F1F] mb-2">{room.name}</h3>
        
        <div className="flex items-center gap-4 text-[#6B6F72] text-sm mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>Up to {room.maxAdults + room.maxChildren} Guests</span>
          </div>
        </div>

        <p className="text-gray-600 mb-8 flex-grow line-clamp-3">
          {room.description || `Experience the perfect blend of comfort and style in our ${room.name}.`}
        </p>

        {parsedAmenities.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            {parsedAmenities.slice(0, 4).map((amenity, i) => (
              <span key={i} className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-100">
                {amenity}
              </span>
            ))}
          </div>
        )}

        <button 
          onClick={() => {
            const el = document.getElementById('booking-bar');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="w-full py-4 text-center border-2 border-[#1F1F1F] text-[#1F1F1F] font-medium rounded-full hover:bg-[#1B2418] hover:text-white transition-colors uppercase tracking-widest text-sm"
        >
          Check Availability
        </button>
      </div>
    </div>
  );
}
