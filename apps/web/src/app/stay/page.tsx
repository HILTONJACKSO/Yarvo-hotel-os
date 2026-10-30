"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Image from 'next/image';
import { Bed, Users, Wifi, Wind, Tv, Coffee, Check } from 'lucide-react';
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

  // Parse structured amenities & features into individual items
  const parseItems = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.flatMap(item => typeof item === 'string' ? item.split('*') : [String(item)]);
    }
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed.flatMap(item => typeof item === 'string' ? item.split('*') : [String(item)]);
        }
      } catch {}
      return val.split('*');
    }
    return [];
  };

  const rawFeatures = [
    ...parseItems(room.amenities),
    ...(room.features ? String(room.features).split(' • ') : []),
    ...(room.description && room.description.includes('*') ? parseItems(room.description) : [])
  ];

  const uniqueFeatures = Array.from(new Set(
    rawFeatures
      .map(s => s.trim())
      .filter(s => s.length > 0 && s !== '*' && s.toLowerCase() !== 'null')
  ));

  const cleanName = (room.name || '').replace(/\s*coming\s*soon\.*/gi, '').trim();
  const n = cleanName.toLowerCase();
  let count = room.maxAdults ? room.maxAdults + (room.maxChildren || 0) : null;
  if (!count) {
    if (n.includes('family')) count = 4;
    else if (n.includes('suite') || n.includes('triple')) count = 3;
    else if (n.includes('solo')) count = 1;
    else count = 2;
  }
  const guestLabel = count === 1 ? 'Up to 1 Guest' : `Up to ${count} Guests`;

  // Determine a clean, natural description sentence without raw asterisks
  let cleanDescription = '';
  if (n.includes('suite')) {
    cleanDescription = 'Exclusive luxury rooftop suite featuring a private rooftop pool, complimentary breakfast, and full pool and beach access.';
  } else if (n.includes('family')) {
    cleanDescription = 'Spacious coastal retreat designed for families and groups, featuring complimentary breakfast, pool and beach access, and ocean views.';
  } else if (n.includes('regular') || n.includes('standard')) {
    cleanDescription = 'Comfortable oceanfront room with complimentary breakfast, direct pool and beach access, air conditioning, and coastal breezes.';
  } else if (n.includes('tent')) {
    cleanDescription = 'Premium beachfront glamping tent just steps from the ocean waves, complete with daily breakfast, plush bedding, and coastal serenity.';
  } else if (room.description) {
    if (room.description.includes('*')) {
      const parts = room.description.split('*').map((s: string) => s.trim()).filter(Boolean);
      const longPart = parts.find((p: string) => p.length > 30);
      cleanDescription = longPart || `Experience the perfect coastal getaway in our ${cleanName}.`;
    } else {
      cleanDescription = room.description;
    }
  } else {
    cleanDescription = `Experience coastal luxury and tranquil ocean breezes in our ${cleanName}.`;
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      <div className={`relative w-full ${isLarge ? 'h-80' : 'h-64'} overflow-hidden`}>
        <img 
          src={imageUrl}
          alt={cleanName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <span className="font-bold text-[#1F1F1F]">{displayPrice}</span>
          <span className="text-sm text-gray-600"> /{priceSuffix}</span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl text-[#1F1F1F] mb-2">{cleanName}</h3>
        
        <div className="flex items-center gap-4 text-[#6B6F72] text-sm mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 font-medium">
            <Users size={16} className="text-[#CA9851]" />
            <span>{guestLabel}</span>
          </div>
        </div>

        <p className="text-gray-600 mb-6 flex-grow text-sm leading-relaxed">
          {cleanDescription}
        </p>

        {uniqueFeatures.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {uniqueFeatures.slice(0, 8).map((feat, i) => (
              <span key={i} className="text-xs px-3 py-1.5 bg-[#FAF9F4] text-[#1F1F1F] rounded-full border border-gray-200/80 font-medium flex items-center gap-1.5 shadow-xs">
                <Check size={13} className="text-[#CA9851] shrink-0" />
                <span>{feat}</span>
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
                detail: { roomTypeId: room.id, roomTypeName: cleanName }
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
