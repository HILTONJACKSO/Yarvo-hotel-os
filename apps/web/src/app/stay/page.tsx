"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Image from 'next/image';
import { Bed, Users, Wifi, Wind, Tv, Coffee } from 'lucide-react';
import { BookingBarInteractive } from '@/components/landing/BookingBarInteractive';

import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';
import { WebsiteContent } from '@/types/cms';

export default function StayPage() {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Split into tents and standard rooms based on API room types or fallback to CMS
  const apiTents = roomTypes.filter(rt => rt.name?.toLowerCase().includes('tent') || rt.code?.toLowerCase().includes('tnt'));
  const apiRooms = roomTypes.filter(rt => !rt.name?.toLowerCase().includes('tent') && !rt.code?.toLowerCase().includes('tnt'));

  const cmsTents = (cmsContent.rooms?.items || []).filter(item => item.type === 'tent');
  const cmsRooms = (cmsContent.rooms?.items || []).filter(item => item.type === 'room' || item.type === 'suite');

  const tents = apiTents.length > 0 ? apiTents : cmsTents;
  const rooms = apiRooms.length > 0 ? apiRooms : cmsRooms;

  const stayData = cmsContent.subpages.stay || DEFAULT_CMS_CONTENT.subpages.stay;

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Navbar general={cmsContent.general} />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <img 
          src={stayData.bgImage || DEFAULT_CMS_CONTENT.subpages.stay.bgImage}
          alt={stayData.title || "Luxury Accommodation"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          {stayData.badge && (
            <span className="text-xs uppercase tracking-[0.2em] text-[#E8E1D7] block mb-3 font-semibold">
              {stayData.badge}
            </span>
          )}
          <h1 className="font-serif text-5xl md:text-7xl mb-6">{stayData.title || "Stay With Us"}</h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">
            {stayData.description || "Experience unparalleled luxury in our oceanfront rooms and glamping tents."}
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
            <h2 className="font-serif text-4xl text-[#1F1F1F] mb-4">
              {cmsContent.rooms?.stayRoomsTitle || "Luxury Rooms & Suites"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {cmsContent.rooms?.stayRoomsDescription || "Wake up to the sound of waves in our meticulously designed rooms, offering breathtaking views and premium amenities."}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F1F1F]"></div></div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room, idx) => <RoomCard key={room.id || idx} room={room} />)}
            </div>
          ) : (
            <p className="text-center text-[#6B6F72]">No rooms available at the moment.</p>
          )}
        </section>

        {/* Tents Section */}
        <section>
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl text-[#1F1F1F] mb-4">
              {cmsContent.rooms?.stayTentsTitle || "Glamping Tents"}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {cmsContent.rooms?.stayTentsDescription || "Immerse yourself in nature without sacrificing comfort in our premium beachfront tents."}
            </p>
          </div>

          {isLoading ? (
             <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F1F1F]"></div></div>
          ) : tents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {tents.map((tent, idx) => <RoomCard key={tent.id || idx} room={tent} isLarge />)}
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

function resolveRoomImageUrl(room: any): string {
  const fallback = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80';
  let raw: any = room?.image;
  if (!raw && room?.images) {
    if (Array.isArray(room.images) && room.images.length > 0) {
      raw = room.images[0];
    } else if (typeof room.images === 'string') {
      try {
        const parsed = JSON.parse(room.images);
        if (Array.isArray(parsed) && parsed.length > 0) raw = parsed[0];
        else raw = room.images;
      } catch {
        raw = room.images;
      }
    }
  }
  if (!raw || typeof raw !== 'string') return fallback;
  const clean = raw.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  if (clean.startsWith('/uploads/')) return clean;
  if (clean.startsWith('uploads/')) return `/${clean}`;
  if (clean.startsWith('/')) return clean;
  return `/uploads/${clean}`;
}

function RoomCard({ room, isLarge = false }: { room: any, isLarge?: boolean }) {
  const imageUrl = resolveRoomImageUrl(room);

  // Parse price
  let displayPrice = '$35';
  let priceSuffix = 'night';
  if (room.baseRateUsd !== undefined && room.baseRateUsd !== null) {
    displayPrice = `$${Number(room.baseRateUsd).toFixed(0)}`;
  } else if (room.price) {
    const parts = String(room.price).split('/');
    displayPrice = parts[0];
    if (parts[1]) priceSuffix = parts[1];
  }

  // Parse amenities if it's a string or array
  let parsedAmenities: string[] = [];
  try {
    if (typeof room.amenities === 'string') {
      parsedAmenities = JSON.parse(room.amenities);
    } else if (Array.isArray(room.amenities)) {
      parsedAmenities = room.amenities;
    } else if (room.features) {
      parsedAmenities = String(room.features).split(' • ');
    }
  } catch(e) {}

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      <div className={`relative w-full ${isLarge ? 'h-80' : 'h-64'} overflow-hidden`}>
        <img 
          src={imageUrl}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <span className="font-bold text-[#1F1F1F]">{displayPrice}</span>
          <span className="text-sm text-gray-600"> /{priceSuffix}</span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl text-[#1F1F1F] mb-2">{room.name}</h3>
        
        <div className="flex items-center gap-4 text-[#6B6F72] text-sm mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>
              {room.maxAdults 
                ? `Up to ${room.maxAdults + (room.maxChildren || 0)} Guests` 
                : (room.features || 'Oceanfront Luxury')}
            </span>
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
            const el = document.getElementById('booking-bar') || document.getElementById('book');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-booking-modal', {
                detail: { roomTypeId: room.id }
              }));
            }
          }}
          className="w-full py-4 text-center border-2 border-[#1F1F1F] text-[#1F1F1F] font-medium rounded-full hover:bg-[#1B2418] hover:text-white transition-colors uppercase tracking-widest text-sm"
        >
          Check Availability
        </button>
      </div>
    </div>
  );
}
