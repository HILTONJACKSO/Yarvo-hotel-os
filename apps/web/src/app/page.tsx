"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { BookingBarInteractive } from "../components/landing/BookingBarInteractive";
import { 
  MapPin, ChevronRight, ChevronLeft, Heart, Star
} from "lucide-react";
import { 
  WebsiteContent, 
  HeroSectionContent, 
  AboutSectionContent, 
  EventsSectionContent, 
  EventInquiryContent, 
  MomentsGalleryContent, 
  FinalCTAContent, 
  CoverflowSlide, 
  TestimonialsContent,
  RoomsTentsSectionContent
} from "@/types/cms";
import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from "@/lib/default-cms-content";

// ==========================================
// 1. COMPONENTS
// ==========================================

const Hero = ({ data }: { data: HeroSectionContent }) => {
  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-center pt-32 pb-32 px-6 md:px-12">
      <div className="absolute inset-0 z-0">
        <img 
          src={data.bgImage || DEFAULT_CMS_CONTENT.hero.bgImage} 
          alt="Kwalee Beach Resort" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/30" />
      </div>

      <div className="relative z-10 max-w-4xl text-white">
        <div className="flex items-center space-x-3 mb-6 text-xs md:text-sm tracking-[0.2em] uppercase">
          <MapPin size={16} />
          <span>{data.subtitle || "Liberia • West African Coast"}</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif leading-[1.1] mb-8 whitespace-pre-line">
          {data.title || "WHERE THE OCEAN\nMEETS YOUR ESCAPE."}
        </h1>
        <p className="text-base md:text-lg lg:text-xl font-sans font-light max-w-2xl mb-10 opacity-90 leading-relaxed">
          {data.description || "Discover the beauty of Kwalee Beach Resort — where the beach, pool, dining, events and coastal atmosphere come together for an unforgettable experience."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href={data.bookButtonLink || "#book"} 
            className="px-8 py-4 bg-white text-[#1F1F1F] uppercase tracking-widest text-sm text-center hover:bg-[#E8E1D7] transition-colors"
          >
            {data.bookButtonText || "Book Your Stay"}
          </Link>
          <Link 
            href={data.exploreButtonLink || "#experience"} 
            className="px-8 py-4 border border-white text-white uppercase tracking-widest text-sm text-center hover:bg-white hover:text-[#1F1F1F] transition-colors"
          >
            {data.exploreButtonText || "Explore the Resort"}
          </Link>
        </div>
      </div>
    </section>
  );
};

const IntroSection = ({ data }: { data: AboutSectionContent }) => {
  return (
    <section id="experience" className="px-6 py-24 md:py-40 max-w-7xl mx-auto flex flex-col items-center">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center w-full">
        <div className="order-2 lg:order-1 flex flex-col items-start pt-4">
          <span className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold tracking-wide text-gray-800 mb-8 uppercase shadow-sm">
            {data.badge || "About Us"}
          </span>
          <h3 className="text-4xl md:text-5xl font-sans font-medium text-[#1F1F1F] leading-[1.15] mb-6 tracking-tight whitespace-pre-line">
            {data.title || "A Place to Slow Down.\nStay Better, Travel Happier."}
          </h3>
          <p className="text-gray-600 text-base md:text-lg mb-10 leading-relaxed max-w-md">
            {data.description || "Escape to a coastal destination where days are shaped by the rhythm of the ocean, warm hospitality, good food, refreshing swims and unforgettable moments by the beach."}
          </p>
          <Link 
            href={data.buttonLink || "#gallery"} 
            className="bg-[#F5A623] text-white px-8 py-3.5 rounded-md font-medium hover:bg-[#D08C1D] transition-colors shadow-md"
          >
            {data.buttonText || "Read More"}
          </Link>
        </div>
        
        <div className="order-1 lg:order-2 relative h-[400px] md:h-[500px] lg:h-[600px] w-full mt-10 lg:mt-0">
          {/* Main Large Horizontal Image */}
          <div className="absolute top-0 right-0 w-[85%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl z-10 group cursor-pointer">
            <img 
              src={data.mainImage || DEFAULT_CMS_CONTENT.about.mainImage} 
              alt={data.mainImageTitle || "Room"} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {(data.mainImageTitle || data.mainImageSubtitle) && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg">
                <h4 className="font-bold text-lg text-gray-900">{data.mainImageTitle}</h4>
                <p className="text-sm text-gray-600 font-medium mt-0.5">{data.mainImageSubtitle}</p>
              </div>
            )}
          </div>
          
          {/* Second Overlapping Horizontal Image */}
          <div className="absolute bottom-0 left-0 w-[60%] aspect-video rounded-2xl overflow-hidden shadow-xl z-20 group cursor-pointer border-4 border-white bg-gray-100">
            <img 
              src={data.secondaryImage || DEFAULT_CMS_CONTENT.about.secondaryImage} 
              alt="Pool" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureSection = ({ id, label, title, text, image, reverse, cta, ctaHref }: any) => {
  return (
    <section id={id} className="py-24 md:py-32 overflow-hidden">
      <div className={`max-w-7xl mx-auto px-6 md:px-12 flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 lg:gap-24 items-center`}>
        <div className="w-full lg:w-1/2 relative aspect-[4/3] lg:aspect-square">
          <img src={image} alt={title} className="w-full h-full object-cover rounded-sm shadow-xl" />
        </div>
        <div className="w-full lg:w-1/2">
          <span className="text-xs uppercase tracking-[0.2em] text-[#4A5D4E] block mb-6">{label}</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1F1F1F] leading-[1.1] mb-8">{title}</h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed mb-10">{text}</p>
          {cta && (
            <Link href={ctaHref || "#"} className="inline-block px-8 py-4 border border-[#1F1F1F] text-[#1F1F1F] uppercase tracking-widest text-sm hover:bg-[#1B2418] hover:text-white transition-colors">
              {cta}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

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

const ServicesSection = ({ data }: { data?: RoomsTentsSectionContent }) => {
  const [liveRooms, setLiveRooms] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/public/room-types')
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setLiveRooms(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const roomsData = data || DEFAULT_CMS_CONTENT.rooms;
  const defaultItems = roomsData.items && roomsData.items.length > 0 ? roomsData.items : DEFAULT_CMS_CONTENT.rooms.items;

  const sortAccommodations = (a: any, b: any) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    const aIsTent = aName.includes('tent') || (a.code || '').toLowerCase().includes('tnt') || a.type === 'tent';
    const bIsTent = bName.includes('tent') || (b.code || '').toLowerCase().includes('tnt') || b.type === 'tent';

    if (!aIsTent && bIsTent) return -1;
    if (aIsTent && !bIsTent) return 1;

    // Both are rooms: Regular Room -> Family Room -> Suite
    if (!aIsTent && !bIsTent) {
      const getRoomRank = (name: string) => {
        if (name.includes('regular') || name.includes('standard')) return 1;
        if (name.includes('family')) return 2;
        if (name.includes('suite')) return 3;
        return 4;
      };
      return getRoomRank(aName) - getRoomRank(bName);
    }

    // Both are tents: Solo -> Double -> Triple
    const getTentRank = (name: string) => {
      if (name.includes('solo')) return 1;
      if (name.includes('double')) return 2;
      if (name.includes('triple')) return 3;
      return 4;
    };
    return getTentRank(aName) - getTentRank(bName);
  };

  const blockedNames = new Set(
    (roomsData.items || [])
      .filter((it: any) => it.isBlocked === true || it.blocked === true)
      .map((it: any) => (it.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const items = liveRooms.length > 0
    ? [...liveRooms]
        .filter(rt => {
          const norm = (rt.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const b of blockedNames) {
            if (b && norm.includes(b)) return false;
          }
          return true;
        })
        .sort(sortAccommodations)
        .map(rt => {
          const cleanName = (rt.name || '').replace(/\s*coming\s*soon\.*/gi, '').trim();
          const n = cleanName.toLowerCase();
          let count = rt.maxAdults ? rt.maxAdults + (rt.maxChildren || 0) : null;
          if (!count) {
            if (n.includes('family')) count = 4;
            else if (n.includes('suite') || n.includes('triple')) count = 3;
            else if (n.includes('solo')) count = 1;
            else count = 2;
          }
          const guestText = count === 1 ? 'Up to 1 Guest' : `Up to ${count} Guests`;
          let parsedAmenities: string[] = [];
          try {
            if (Array.isArray(rt.amenities)) {
              parsedAmenities = rt.amenities.flatMap((a: any) => typeof a === 'string' ? a.split('*') : [String(a)]);
            } else if (typeof rt.amenities === 'string') {
              const p = JSON.parse(rt.amenities);
              parsedAmenities = Array.isArray(p) ? p.flatMap((a: any) => typeof a === 'string' ? a.split('*') : [String(a)]) : rt.amenities.split('*');
            }
          } catch {
            if (typeof rt.amenities === 'string') parsedAmenities = rt.amenities.split('*');
          }
          parsedAmenities = parsedAmenities.map(s => s.trim()).filter(s => s.length > 0 && s !== '*');
          const displayFeatures = [guestText, ...parsedAmenities.slice(0, 2)].join(' • ');

          return {
            id: rt.id,
            name: cleanName,
            image: resolveRoomImageUrl(rt),
            rating: '5.0',
            location: 'Kwalee Beach Resort • Oceanfront',
            features: displayFeatures,
            price: `$${Number(rt.baseRateUsd || 35).toFixed(0)}/night`,
            bookUrl: '/stay',
          };
        })
    : [...defaultItems].filter((it: any) => !it.isBlocked && !it.blocked).sort(sortAccommodations);

  const badge = roomsData.badge || DEFAULT_CMS_CONTENT.rooms.badge;
  const title = roomsData.title || DEFAULT_CMS_CONTENT.rooms.title;
  const description = roomsData.description || DEFAULT_CMS_CONTENT.rooms.description;

  return (
    <section id="stay" className="py-24 md:py-32 bg-[#FAF9F4] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="px-4 py-1.5 rounded-full border border-gray-300 text-xs font-bold tracking-widest text-gray-800 mb-6 inline-block uppercase bg-white">
              {badge}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-[64px] font-sans font-bold text-[#1F1F1F] leading-tight tracking-tight whitespace-pre-line">
              {title}
            </h2>
          </div>
          <div className="max-w-sm lg:text-right text-left pb-2">
            <p className="text-[#6B6F72] text-sm md:text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {items.map((room, idx) => (
              <Link href={room.bookUrl || "/stay"} key={room.id || idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group cursor-pointer transition-shadow hover:shadow-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden p-2 pb-0">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover rounded-t-xl transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-6 left-6 bg-white/40 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
                    {room.rating} <Star size={12} className="fill-[#F5B041] text-[#F5B041]" />
                  </div>
                  <div className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors bg-black/20 p-2 rounded-full backdrop-blur-sm">
                    <Heart size={16} strokeWidth={2} />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1">{room.name}</h3>
                  <p className="text-[#6B6F72]/80 text-xs mb-6 truncate">{room.location}</p>
                  
                  <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2 text-[#6B6F72] text-xs font-medium">
                      {(room.features || ((room as any).description && (room as any).description.includes('*') ? (room as any).description : 'Oceanfront • Luxury'))
                        .split(/[•*]/)
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((feat: string, i: number) => (
                          <span key={i} className="flex items-center gap-1">{feat}</span>
                        ))}
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <span className="font-bold text-lg text-gray-900 block leading-none">{(room.price || '').split('/')[0]}</span>
                      {room.price?.includes('/') && (
                        <span className="text-xs text-[#6B6F72]/80">/{room.price.split('/')[1]}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CoverflowTestimonialsSection = ({ 
  slides, 
  testimonials 
}: { 
  slides: CoverflowSlide[]; 
  testimonials: TestimonialsContent; 
}) => {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isHovered, setIsHovered] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const slideList = slides && slides.length > 0 ? slides : DEFAULT_CMS_CONTENT.coverflow;
  const reviewList = testimonials?.items && testimonials.items.length > 0 
    ? testimonials.items 
    : DEFAULT_CMS_CONTENT.testimonials.items;

  useEffect(() => {
    if (isHovered || slideList.length === 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideList.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isHovered, slideList.length]);

  const getPositionStyles = (index: number) => {
    const total = slideList.length;
    const diff = (index - activeIndex + total) % total;
    if (diff === 0) {
      return "z-20 left-[50%] -translate-x-[50%] w-[65%] md:w-[45%] lg:w-[35%] opacity-100 scale-100 shadow-2xl border-[8px] border-white/10 blur-0";
    } else if (diff === 1 || diff === total - 4) {
      return "z-10 left-[75%] -translate-x-[50%] w-[35%] md:w-[25%] lg:w-[22%] opacity-80 scale-90 blur-[1px] shadow-lg hidden sm:block";
    } else if (diff === 2 || diff === total - 3) {
      return "z-0 left-[95%] -translate-x-[50%] w-[25%] md:w-[20%] opacity-40 scale-75 blur-[2px] hidden sm:block";
    } else if (diff === 3 || diff === total - 2) {
      return "z-0 left-[5%] -translate-x-[50%] w-[25%] md:w-[20%] opacity-40 scale-75 blur-[2px] hidden sm:block";
    } else if (diff === 4 || diff === total - 1) {
      return "z-10 left-[25%] -translate-x-[50%] w-[35%] md:w-[25%] lg:w-[22%] opacity-80 scale-90 blur-[1px] shadow-lg hidden sm:block";
    }
    return "hidden";
  };

  const currentTestimonial = reviewList[testimonialIndex % reviewList.length];

  return (
    <section className="py-24 bg-[#FAF9F4] px-6 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Coverflow Gallery */}
        <div 
          className="w-full relative flex items-center h-[300px] md:h-[450px] mb-24 max-w-5xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {slideList.map((slide, idx) => {
            const diff = (idx - activeIndex + slideList.length) % slideList.length;
            const isCenter = diff === 0;
            return (
              <div 
                key={slide.id || idx}
                onClick={() => setActiveIndex(idx)}
                className={`absolute aspect-[3/4] rounded-xl overflow-hidden transition-all duration-700 cursor-pointer group ${getPositionStyles(idx)}`}
              >
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className={`w-full h-full object-cover transition-all duration-700 ${isCenter ? 'brightness-75 group-hover:brightness-90' : 'brightness-100'}`} 
                />
                {isCenter && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                     <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold font-sans drop-shadow-lg leading-tight tracking-tight whitespace-pre-line">{slide.title}</h3>
                     <p className="text-white/80 text-xs md:text-sm mt-3 drop-shadow-md">{slide.subtitle}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        {currentTestimonial && (
          <div className="max-w-6xl w-full flex flex-col lg:flex-row justify-between gap-16 lg:gap-20 mt-12 bg-white p-10 md:p-16 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            {/* Left Side */}
            <div className="lg:w-[35%] flex flex-col">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#F5A623] mb-4 block">
                {testimonials.badge || "Testimonials"}
              </span>
              <h2 className="text-3xl md:text-5xl font-serif text-[#1F1F1F] leading-[1.1] mb-6 whitespace-pre-line">
                {testimonials.title || "What Our\nGuests Say"}
              </h2>
              <p className="text-[#6B6F72] text-sm leading-relaxed max-w-sm mb-12 font-light">
                {testimonials.description || "Experience Kwalee Beach Resort through the eyes of those who have stayed with us. We take pride in delivering unforgettable moments and exceptional coastal hospitality."}
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <button 
                  onClick={() => setTestimonialIndex((prev) => (prev - 1 + reviewList.length) % reviewList.length)}
                  className="w-12 h-12 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-[#F5A623] hover:text-white hover:border-[#F5A623] transition-all shadow-sm cursor-pointer"
                  aria-label="Previous review"
                >
                  <ChevronLeft size={20} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={() => setTestimonialIndex((prev) => (prev + 1) % reviewList.length)}
                  className="w-12 h-12 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-[#F5A623] hover:text-white hover:border-[#F5A623] transition-all shadow-sm cursor-pointer"
                  aria-label="Next review"
                >
                  <ChevronRight size={20} strokeWidth={1.5} />
                </button>
                
                <div className="flex items-center ml-8 hidden sm:flex">
                  <div className="flex -space-x-3">
                    <img className="w-10 h-10 rounded-full border-[3px] border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Guest"/>
                    <img className="w-10 h-10 rounded-full border-[3px] border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Guest"/>
                    <img className="w-10 h-10 rounded-full border-[3px] border-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Guest"/>
                  </div>
                  <div className="ml-4 flex flex-col">
                    <span className="text-sm font-bold text-gray-900 leading-tight">
                      {testimonials.ratingScore || "4.8/5"}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#6B6F72]/80 font-bold">
                      {testimonials.ratingCount || "from 2,800+ reviews"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="lg:w-[60%] flex flex-col justify-center relative">
              <div className="absolute -top-6 -left-6 text-[#F5A623] opacity-10 pointer-events-none">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 21L16.41 14.904C16.634 14.303 16.746 13.682 16.746 13.044V3H23V12.784C23 15.65 21.848 18.232 19.544 21H14.017ZM3 21L5.393 14.904C5.617 14.303 5.729 13.682 5.729 13.044V3H12V12.784C12 15.65 10.848 18.232 8.544 21H3Z" />
                </svg>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-1 mb-8">
                   <Star size={16} className="fill-[#F5A623] text-[#F5A623]" />
                   <Star size={16} className="fill-[#F5A623] text-[#F5A623]" />
                   <Star size={16} className="fill-[#F5A623] text-[#F5A623]" />
                   <Star size={16} className="fill-[#F5A623] text-[#F5A623]" />
                   <Star size={16} className="fill-[#F5A623] text-[#F5A623]" />
                </div>
                
                <h4 className="text-xl md:text-3xl font-serif text-[#1F1F1F] leading-relaxed mb-10 transition-opacity duration-300 min-h-[120px] italic">
                  "{currentTestimonial.text}"
                </h4>
                
                <div className="flex items-center gap-5 pt-6 border-t border-gray-100">
                   <img 
                     className="w-14 h-14 rounded-full object-cover transition-all duration-300 shadow-sm" 
                     src={currentTestimonial.avatar} 
                     alt={currentTestimonial.author} 
                   />
                   <div>
                     <h5 className="font-bold text-base text-gray-900 tracking-wide">{currentTestimonial.author}</h5>
                     <p className="text-xs text-[#6B6F72]/80 mt-1 uppercase tracking-widest">
                       Via {currentTestimonial.source}
                     </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

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

const EventsSection = ({ data, onSelectEvent }: { data: EventsSectionContent; onSelectEvent?: (name: string) => void }) => {
  const [spaces, setSpaces] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/event-spaces')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data) setSpaces(d.data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="events" className="py-24 md:py-40 bg-[#1B2418] text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5 flex flex-col justify-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#E8E1D7] block mb-6">
            {data.badge || "Events & Gatherings"}
          </span>
          <h2 className="text-4xl md:text-6xl font-serif leading-[1.1] mb-8 whitespace-pre-line">
            {data.title || "YOUR MOMENT.\nYOUR PEOPLE.\nYOUR BEACH."}
          </h2>
          <p className="text-lg font-light leading-relaxed mb-12 opacity-80">
            {data.description || "From birthdays and private celebrations to corporate gatherings, parties and special occasions, Kwalee Beach Resort provides a memorable coastal setting for events."}
          </p>
          
          <ul className="space-y-4 mb-12">
            {(data.highlights && data.highlights.length > 0 ? data.highlights : [
              "Romantic Heartshape Beach Dinners",
              "Romantic Poolside Candlelight Dinners",
              "Coastal Jazz & Live Music Nights",
              "Beachfront Karaoke & Big Screen Movie Nights",
              "Sunset Bonfires, Music & Celebrations"
            ]).map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 text-lg font-serif">
                <div className="w-1.5 h-1.5 bg-[#E8E1D7] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
          
          <div>
            <Link 
              href="/events" 
              className="inline-block px-8 py-4 bg-white text-[#1F1F1F] uppercase tracking-widest text-sm hover:bg-[#E8E1D7] transition-colors"
            >
              Explore All Event Spaces
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 relative h-[450px] lg:h-auto min-h-[400px]">
          <img 
            src={data.image || DEFAULT_CMS_CONTENT.events.image} 
            alt="Events at Kwalee" 
            className="w-full h-full object-cover rounded-sm"
          />
        </div>

        {spaces.length > 0 && (
          <div className="lg:col-span-12 mt-8 pt-12 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#E8E1D7] block mb-2 font-semibold">Live Backend Packages</span>
                <h3 className="text-2xl md:text-3xl font-serif text-white">Our Event Spaces & Signature Experiences</h3>
              </div>
              <Link href="/events" className="text-sm uppercase tracking-widest text-[#E8E1D7] hover:text-white underline underline-offset-8">
                View All {spaces.length} Spaces &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {spaces.map((space) => {
                const eventImg = data?.spaceImages?.[space.id] || data?.spaceImages?.[space.name] || space.image || getEventImage(space.name);
                const priceFormatted = formatEventPrice(space);
                return (
                  <div key={space.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all flex flex-col justify-between group">
                    <div className="relative w-full h-44 overflow-hidden bg-black/30">
                      <img 
                        src={eventImg} 
                        alt={space.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
                        {priceFormatted}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-white mb-1.5">{space.name}</h4>
                        <p className="text-xs text-[#E8E1D7]/75 mb-4">Capacity: Up to {space.capacity} Guests</p>
                      </div>
                      <Link 
                        href="/events" 
                        className="w-full text-center py-2.5 px-4 rounded-xl border border-white/30 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-[#1B2418] transition-colors"
                      >
                        Book Event Space
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const EventInquiryForm = ({ data, selectedEvent }: { data: EventInquiryContent; selectedEvent?: string }) => {
  const whatsappDigits = (data.whatsappNumber || "+231774340843").replace(/[^0-9]/g, '');
  const [spaces, setSpaces] = useState<any[]>([]);
  const [eventType, setEventType] = useState(selectedEvent || '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    fetch('/api/event-spaces')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data) setSpaces(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedEvent) setEventType(selectedEvent);
  }, [selectedEvent]);

  const [showSendChoiceModal, setShowSendChoiceModal] = useState(false);

  const getInquiryText = () => {
    return `Hello Kwalee Beach Resort! I would like to inquire about hosting an event:
Event: ${eventType || 'Custom Celebration'}
Name: ${fullName || 'Guest'}
Phone: ${phone || 'N/A'}
Estimated Guests: ${guests || 'N/A'}
Preferred Date: ${date || 'Flexible'}
Details: ${message || 'Please send available dates and package information.'}`;
  };

  const recordBookingInSystem = () => {
    fetch('/api/event-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: fullName || 'Guest',
        guestPhone: phone || 'N/A',
        eventType: eventType || 'Event Inquiry',
        attendeesCount: Number(guests) || 1,
        startTime: date ? `${date}T12:00:00Z` : new Date().toISOString(),
        endTime: date ? `${date}T18:00:00Z` : new Date(Date.now() + 4 * 3600000).toISOString(),
        specialRequests: message,
      })
    }).catch(() => {});
  };

  const handleWhatsAppClick = () => {
    recordBookingInSystem();
    const text = getInquiryText();
    window.open(`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmailClick = () => {
    recordBookingInSystem();
    const subject = `Event Inquiry: ${eventType || 'Celebration'} - ${fullName || 'Guest'}`;
    const body = getInquiryText();
    window.location.href = `mailto:kwaleebeachresort1@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="inquiry" className="py-24 md:py-32 px-6 relative bg-[#FAF9F4]">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-8 md:p-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#F5A623] mb-4 block">
              {data.badge || "Plan With Us"}
            </span>
            <h2 className="text-3xl md:text-5xl font-serif mb-4 text-[#1F1F1F]">
              {data.title || "Event Inquiry"}
            </h2>
            <p className="text-[#6B6F72] font-light max-w-lg mx-auto">
              {data.description || "Tell us about your upcoming event and our dedicated team will get in touch to bring your vision to life."}
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setShowSendChoiceModal(true); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#6B6F72] mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-5 py-4 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all" 
                  placeholder="John Doe" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#6B6F72] mb-2">Phone / WhatsApp</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-5 py-4 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all" 
                  placeholder="+231..." 
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#6B6F72] mb-2">Event Package / Venue</label>
                <select 
                  value={eventType} 
                  onChange={e => setEventType(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-5 py-4 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all cursor-pointer"
                >
                  <option value="">Select an Event Package...</option>
                  {spaces.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({formatEventPrice(s)} • Up to {s.capacity} Guests)
                    </option>
                  ))}
                  <option value="Wedding Ceremony">Wedding Ceremony</option>
                  <option value="Corporate Retreat">Corporate Retreat</option>
                  <option value="Birthday Celebration">Birthday Celebration</option>
                  <option value="Other Private Celebration">Other Private Celebration</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#6B6F72] mb-2">Estimated Guests</label>
                <input 
                  type="number" 
                  value={guests}
                  onChange={e => setGuests(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-5 py-4 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all" 
                  placeholder="e.g. 20" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#6B6F72] mb-2">Preferred Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-5 py-4 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all text-[#6B6F72]" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#6B6F72] mb-2">Message & Special Requests</label>
              <textarea 
                rows={3} 
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-5 py-4 outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all resize-none" 
                placeholder="Preferred arrival time, special culinary preferences, setup ideas..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="submit" 
                className="flex-1 px-8 py-4 bg-[#1B2418] text-white uppercase tracking-widest text-xs font-bold rounded-xl shadow-lg hover:bg-[#F5A623] hover:shadow-[#F5A623]/20 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📬</span>
                <span>{data.submitButtonText || "Send Request (WhatsApp or Email)"}</span>
              </button>
              <button 
                type="button" 
                onClick={handleWhatsAppClick}
                className="px-6 py-4 border border-[#25D366] bg-[#25D366]/10 text-[#1B2418] hover:bg-[#25D366] hover:text-white uppercase tracking-widest text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                title="Send via WhatsApp"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </button>
              <button 
                type="button" 
                onClick={handleEmailClick}
                className="px-6 py-4 border border-gray-300 bg-gray-50 text-[#1B2418] hover:bg-gray-200 uppercase tracking-widest text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
                title="Send via Email"
              >
                <span>✉️</span>
                <span>Email</span>
              </button>
            </div>
          </form>

          {/* Send Choice Modal: WhatsApp or Email */}
          {showSendChoiceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  📬
                </div>
                <h3 className="font-serif text-2xl text-[#1F1F1F] mb-2">Send Your Request</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  How would you prefer to send your inquiry to Kwalee Beach Resort? Please choose:
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendChoiceModal(false);
                      handleWhatsAppClick();
                    }}
                    className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/30 transition-all cursor-pointer"
                  >
                    <span className="text-xl">💬</span>
                    <span>Send via WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendChoiceModal(false);
                      handleEmailClick();
                    }}
                    className="w-full py-4 px-6 bg-[#1B2418] hover:bg-[#2c3b27] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-black/20 transition-all cursor-pointer"
                  >
                    <span className="text-xl">✉️</span>
                    <span>Send via Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSendChoiceModal(false)}
                    className="mt-2 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const GallerySection = ({ data }: { data: MomentsGalleryContent }) => {
  const images = data.images && data.images.length > 0 ? data.images : DEFAULT_CMS_CONTENT.gallery.images;

  return (
    <section id="gallery" className="py-24 bg-[#FAF9F4] px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-serif text-center mb-16 tracking-wide">
          {data.title || "MOMENTS AT KWALEE"}
        </h2>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
          {images.map((imgUrl, idx) => (
            <img 
              key={idx} 
              src={imgUrl} 
              className="w-full rounded-sm object-cover shadow-sm hover:shadow-lg transition-shadow duration-300" 
              alt={`Gallery moment ${idx + 1}`} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = ({ data }: { data: FinalCTAContent }) => {
  return (
    <section className="relative h-[80vh] flex items-center justify-center text-center px-6">
      <div className="absolute inset-0 z-0">
        <img 
          src={data.bgImage || DEFAULT_CMS_CONTENT.finalCta.bgImage} 
          alt="Sunset at Kwalee" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 max-w-2xl text-white">
        <h2 className="text-5xl md:text-7xl font-serif mb-8 leading-[1.1] whitespace-pre-line">
          {data.title || "YOUR ESCAPE\nSTARTS HERE."}
        </h2>
        <p className="text-xl font-light mb-12 opacity-90">
          {data.subtitle || "Come for the beach. Stay for the experience."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href={data.button1Link || "#book"} 
            className="px-8 py-4 bg-white text-[#1F1F1F] uppercase tracking-widest text-sm hover:bg-[#E8E1D7] transition-colors"
          >
            {data.button1Text || "Book Your Stay"}
          </Link>
          <Link 
            href={data.button2Link || "#inquiry"} 
            className="px-8 py-4 border border-white text-white uppercase tracking-widest text-sm hover:bg-white hover:text-[#1F1F1F] transition-colors"
          >
            {data.button2Text || "Plan An Event"}
          </Link>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 2. MAIN LANDING PAGE
// ==========================================
export default function LandingPage() {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CMS_CONTENT);

  useEffect(() => {
    fetch('/api/cms', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setContent(mergeWithDefaultContent(json.data));
        }
      })
      .catch((err) => {
        console.error('Failed to load live CMS content:', err);
      });
  }, []);

  return (
    <main className="font-sans text-[#1F1F1F] bg-[#FAF9F4] selection:bg-[#E8E1D7] selection:text-[#1F1F1F]">
      <Navbar general={content.general} />
      <Hero data={content.hero} />
      <BookingBarInteractive />
      <IntroSection data={content.about} />
      
      <FeatureSection 
        id="beach"
        label={content.features.beach.label}
        title={content.features.beach.title}
        text={content.features.beach.description}
        image={content.features.beach.image}
        cta={content.features.beach.cta}
        ctaHref={content.features.beach.ctaHref}
      />
      
      <FeatureSection 
        id="pool"
        label={content.features.pool.label}
        title={content.features.pool.title}
        text={content.features.pool.description}
        image={content.features.pool.image}
        reverse={true}
        cta={content.features.pool.cta}
        ctaHref={content.features.pool.ctaHref}
      />
      
      <FeatureSection 
        id="bar"
        label={content.features.bar.label}
        title={content.features.bar.title}
        text={content.features.bar.description}
        image={content.features.bar.image}
        cta={content.features.bar.cta}
        ctaHref={content.features.bar.ctaHref}
      />
      
      <FeatureSection 
        id="dining"
        label={content.features.dining.label}
        title={content.features.dining.title}
        text={content.features.dining.description}
        image={content.features.dining.image}
        reverse={true}
        cta={content.features.dining.cta}
        ctaHref={content.features.dining.ctaHref}
      />
      
      <ServicesSection data={content.rooms} />
      <CoverflowTestimonialsSection 
        slides={content.coverflow} 
        testimonials={content.testimonials} 
      />
      <EventsSection data={content.events} />
      <EventInquiryForm data={content.inquiry} />
      <GallerySection data={content.gallery} />
      
      <FinalCTA data={content.finalCta} />
      <Footer general={content.general} />
    </main>
  );
}
