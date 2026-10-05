"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { BookingBarInteractive } from "../components/landing/BookingBarInteractive";
import { 
  Menu, X, MapPin, Phone, Mail, Instagram, Facebook, 
  ChevronRight, ChevronLeft, Heart, Star, Calendar, Users, Home as HomeIcon, Check
} from "lucide-react";
import Image from "next/image";

// ==========================================
// 1. CONSTANTS & THEME
// ==========================================
const THEME = {
  colors: {
    ivory: "#FAFAF7",
    charcoal: "#1A1A1A",
    sand: "#E8E1D7",
    ocean: "#2B4B5C",
    green: "#4A5D4E",
  }
};

const placeholder = (keyword: string, width = 1600, height = 900) => 
  `https://images.unsplash.com/photo-${keyword}?auto=format&fit=crop&w=${width}&q=80`;

const IMAGES = {
  hero: "1611892440504-42a792e24d32", 
  intro: "1582719508461-905c673771fd",
  beach: "1507525428034-b723cf961d3e", 
  pool: "1499793983690-e29da59ef1c2", // Fixed broken pool ID
  bar: "1514362545857-3bc16c4c7d1b",
  dining: "1544148103-0773bf10d330",
  events: "1499793983690-e29da59ef1c2", // Hopefully this one works too
  rooms: {
    r1: "1582719508461-905c673771fd", 
    r2: "1631049307264-da0ec9d70304", 
  },
  sunset: "1507525428034-b723cf961d3e"
};

// ==========================================
// 2. COMPONENTS
// ==========================================

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-center pt-32 pb-32 px-6 md:px-12">
      <div className="absolute inset-0 z-0">
        <img 
          src={placeholder(IMAGES.hero)} 
          alt="Kwalee Beach Resort" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/30" />
      </div>

      <div className="relative z-10 max-w-4xl text-white">
        <div className="flex items-center space-x-3 mb-6 text-xs md:text-sm tracking-[0.2em] uppercase">
          <MapPin size={16} />
          <span>Liberia • West African Coast</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif leading-[1.1] mb-8">
          WHERE THE OCEAN<br className="hidden md:block" /> MEETS YOUR ESCAPE.
        </h1>
        <p className="text-base md:text-lg lg:text-xl font-sans font-light max-w-2xl mb-10 opacity-90 leading-relaxed">
          Discover the beauty of Kwalee Beach Resort — where the beach, pool, dining, events and coastal atmosphere come together for an unforgettable experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="#book" className="px-8 py-4 bg-white text-[#1A1A1A] uppercase tracking-widest text-sm text-center hover:bg-[#E8E1D7] transition-colors">
            Book Your Stay
          </Link>
          <Link href="#experience" className="px-8 py-4 border border-white text-white uppercase tracking-widest text-sm text-center hover:bg-white hover:text-[#1A1A1A] transition-colors">
            Explore the Resort
          </Link>
        </div>
      </div>
    </section>
  );
};



const IntroSection = () => {
  return (
    <section id="experience" className="px-6 py-24 md:py-40 max-w-7xl mx-auto flex flex-col items-center">

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center w-full">
        <div className="order-2 lg:order-1 flex flex-col items-start pt-4">
          <span className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold tracking-wide text-gray-800 mb-8 uppercase shadow-sm">
            About Us
          </span>
          <h3 className="text-4xl md:text-5xl font-sans font-medium text-[#1A1A1A] leading-[1.15] mb-6 tracking-tight">
            A Place to Slow Down.<br/>Stay Better, Travel Happier.
          </h3>
          <p className="text-gray-600 text-base md:text-lg mb-10 leading-relaxed max-w-md">
            Escape to a coastal destination where days are shaped by the rhythm of the ocean, warm hospitality, good food, refreshing swims and unforgettable moments by the beach.
          </p>
          <Link href="#gallery" className="bg-[#a67b27] text-white px-8 py-3.5 rounded-md font-medium hover:bg-[#8f6920] transition-colors shadow-md">
            Read More
          </Link>
        </div>
        
        <div className="order-1 lg:order-2 relative h-[400px] md:h-[500px] lg:h-[600px] w-full mt-10 lg:mt-0">
          {/* Main Large Horizontal Image */}
          <div className="absolute top-0 right-0 w-[85%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl z-10 group cursor-pointer">
            <img 
              src={placeholder(IMAGES.rooms.r1)} 
              alt="Room" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg">
              <h4 className="font-bold text-lg text-gray-900">Ocean Room</h4>
              <p className="text-sm text-gray-600 font-medium mt-0.5">Wake up to the sound of waves</p>
            </div>
          </div>
          
          {/* Second Overlapping Horizontal Image */}
          <div className="absolute bottom-0 left-0 w-[60%] aspect-video rounded-2xl overflow-hidden shadow-xl z-20 group cursor-pointer border-4 border-white bg-gray-100">
            <img 
              src={placeholder(IMAGES.pool)} 
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1A1A1A] leading-[1.1] mb-8">{title}</h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed mb-10">{text}</p>
          {cta && (
            <Link href={ctaHref || "#"} className="inline-block px-8 py-4 border border-[#1A1A1A] text-[#1A1A1A] uppercase tracking-widest text-sm hover:bg-[#1A1A1A] hover:text-white transition-colors">
              {cta}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

const ServicesSection = () => {
  const rooms = [
    {
      name: "Oceanfront Double Tent",
      location: "Kpakpa Kon, Marshall, Liberia",
      features: "2 Bed • 2 Bath",
      price: "$35/night",
      rating: "4.8",
      img: placeholder(IMAGES.rooms.r1)
    },
    {
      name: "Family Triple Tent",
      location: "Kpakpa Kon, Marshall, Liberia",
      features: "3 Bed • 2 Bath",
      price: "$45/night",
      rating: "4.8",
      img: placeholder(IMAGES.rooms.r2)
    },
    {
      name: "Deluxe Family Suite",
      location: "Kpakpa Kon, Marshall, Liberia",
      features: "4 Bed • 3 Bath",
      price: "$120/night",
      rating: "4.9",
      img: placeholder(IMAGES.hero)
    }
  ];

  return (
    <section id="stay" className="py-24 md:py-32 bg-[#FAFAF7] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="px-4 py-1.5 rounded-full border border-gray-300 text-xs font-bold tracking-widest text-gray-800 mb-6 inline-block uppercase bg-white">
              POPULAR SERVICES
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-[64px] font-sans font-bold text-[#1A1A1A] leading-tight tracking-tight">
              Services Built For<br/>Travelers.
            </h2>
          </div>
          <div className="max-w-sm lg:text-right text-left pb-2">
            <p className="text-gray-500 text-sm md:text-sm leading-relaxed">
              Kwalee provides smart tools, secure payments, verified reviews, ensuring smooth, confident, and effortless hotel booking.
            </p>
          </div>
        </div>

        <div className="relative group">
          {/* Arrow Left */}
          <button className="absolute -left-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-black transition opacity-0 group-hover:opacity-100 hidden md:flex border border-gray-100 cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          
          {/* Arrow Right */}
          <button className="absolute -right-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-[#a67b27] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#8f6920] transition opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer">
            <ChevronRight size={24} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rooms.map((room, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group cursor-pointer transition-shadow hover:shadow-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden p-2 pb-0">
                  <img src={room.img} alt={room.name} className="w-full h-full object-cover rounded-t-xl transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-6 left-6 bg-white/40 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
                    {room.rating} <Star size={12} className="fill-[#F5B041] text-[#F5B041]" />
                  </div>
                  <div className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors bg-black/20 p-2 rounded-full backdrop-blur-sm">
                    <Heart size={16} strokeWidth={2} />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1">{room.name}</h3>
                  <p className="text-gray-400 text-xs mb-6 truncate">{room.location}</p>
                  
                  <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                    <div className="flex gap-4 text-gray-500 text-xs font-medium">
                      {room.features.split(' • ').map((feat, i) => (
                         <span key={i} className="flex items-center gap-1">{feat}</span>
                      ))}
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <span className="font-bold text-lg text-gray-900 block leading-none">{room.price.split('/')[0]}</span>
                      <span className="text-xs text-gray-400">/{room.price.split('/')[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CoverflowTestimonialsSection = () => {
  return (
    <section className="py-24 bg-[#FAFAF7] px-6 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Coverflow Gallery */}
        <div className="w-full relative flex justify-center items-center h-[300px] md:h-[450px] mb-24 max-w-5xl mx-auto">
          {/* Far Left */}
          <div className="absolute left-[-5%] md:left-[5%] w-[25%] md:w-[20%] aspect-[3/4] rounded-lg overflow-hidden opacity-40 scale-75 blur-[2px] transition-all hidden sm:block">
            <img src={placeholder(IMAGES.beach)} className="w-full h-full object-cover" />
          </div>
          {/* Mid Left */}
          <div className="absolute left-[5%] md:left-[15%] lg:left-[20%] w-[35%] md:w-[25%] lg:w-[22%] aspect-[3/4] rounded-xl overflow-hidden opacity-80 scale-90 blur-[1px] shadow-lg transition-all z-10 hidden sm:block">
            <img src={placeholder(IMAGES.bar)} className="w-full h-full object-cover" />
          </div>
          
          {/* Center */}
          <div className="absolute z-20 w-[65%] md:w-[45%] lg:w-[35%] aspect-[3/4] rounded-sm overflow-hidden shadow-2xl scale-100 transition-all group cursor-pointer border-[8px] border-white/10">
            <img src={placeholder(IMAGES.dining)} className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
               <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold font-sans drop-shadow-lg leading-tight tracking-tight">Festive Grand<br/>Interior</h3>
               <p className="text-white/80 text-xs md:text-sm mt-3 drop-shadow-md">Adventure is never far away.</p>
            </div>
          </div>
          
          {/* Mid Right */}
          <div className="absolute right-[5%] md:right-[15%] lg:right-[20%] w-[35%] md:w-[25%] lg:w-[22%] aspect-[3/4] rounded-xl overflow-hidden opacity-80 scale-90 blur-[1px] shadow-lg transition-all z-10 hidden sm:block">
            <img src={placeholder(IMAGES.events)} className="w-full h-full object-cover" />
          </div>
          {/* Far Right */}
          <div className="absolute right-[-5%] md:right-[5%] w-[25%] md:w-[20%] aspect-[3/4] rounded-lg overflow-hidden opacity-40 scale-75 blur-[2px] transition-all hidden sm:block">
            <img src={placeholder(IMAGES.hero)} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-5xl w-full flex flex-col lg:flex-row justify-between gap-16 lg:gap-24">
          {/* Left Side */}
          <div className="lg:w-[40%] flex flex-col">
            <span className="text-xs font-bold tracking-wide text-gray-500 mb-6 block capitalize">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold font-sans text-gray-900 leading-[1.15] mb-6 tracking-tight">
              Client about<br/>our work
            </h2>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-xs mb-16">
              Proactively morph optimal intermediaries rather than accurate expertise. Intrinsicly progressive resources.
            </p>
            
            <div className="flex items-center gap-4 mt-auto">
              <button className="w-10 h-10 rounded-full bg-[#a67b27] text-white flex items-center justify-center hover:bg-[#8f6920] transition shadow-md">
                <ChevronLeft size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition shadow-sm">
                <ChevronRight size={20} />
              </button>
              
              <div className="flex items-center ml-8">
                <div className="flex -space-x-3">
                  <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
                  <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
                  <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
                </div>
                <span className="ml-3 text-xs font-bold text-gray-500">+900</span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="lg:w-[55%] flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-5xl md:text-[64px] font-bold text-gray-900 font-sans tracking-tighter leading-none">4.80</h3>
              <div className="bg-[#d49931] px-3 py-1.5 rounded flex flex-col items-center shadow-sm">
                 <div className="flex text-white text-xs gap-0.5 mb-0.5">
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                 </div>
                 <p className="text-[10px] text-white font-semibold">2,898 review</p>
              </div>
              <p className="text-[10px] text-gray-400 max-w-[120px] ml-auto text-right hidden md:block leading-tight">
                Proactively morph optimal intermediaries rather than accurate expertise.
              </p>
            </div>
            
            <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-8 font-sans max-w-lg">
              Brilliant staff and exceptional customer service. The place is fantastic. Great facilities and atmosphere. Buffet breakfast daily is very generous.
            </h4>
            
            <div className="flex items-center gap-4">
               <img className="w-12 h-12 rounded-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Karar Mahmud" />
               <div>
                 <h5 className="font-bold text-sm text-gray-900">Karar Mahmud</h5>
                 <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                   TripAdvisor
                 </p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
};

const EventsSection = () => {
  return (
    <section id="events" className="py-24 md:py-40 bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        <div className="lg:col-span-5 flex flex-col justify-center">
          <span className="text-xs uppercase tracking-[0.2em] text-[#E8E1D7] block mb-6">Events & Gatherings</span>
          <h2 className="text-4xl md:text-6xl font-serif leading-[1.1] mb-8">
            YOUR MOMENT.<br/>YOUR PEOPLE.<br/>YOUR BEACH.
          </h2>
          <p className="text-lg font-light leading-relaxed mb-12 opacity-80">
            From birthdays and private celebrations to corporate gatherings, parties and special occasions, Kwalee Beach Resort provides a memorable coastal setting for events.
          </p>
          
          <ul className="space-y-4 mb-12">
            {["Birthdays", "Weddings & Celebrations", "Private Parties", "Corporate Events", "Beach Gatherings"].map(item => (
              <li key={item} className="flex items-center gap-4 text-lg font-serif">
                <div className="w-1.5 h-1.5 bg-[#E8E1D7] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
          
          <div>
            <Link href="#inquiry" className="inline-block px-8 py-4 bg-white text-[#1A1A1A] uppercase tracking-widest text-sm hover:bg-[#E8E1D7] transition-colors">
              Plan Your Event
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7 relative h-[600px] lg:h-auto">
          <img 
            src={placeholder(IMAGES.events)} 
            alt="Events at Kwalee" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

const EventInquiryForm = () => {
  return (
    <section id="inquiry" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Event Inquiry</h2>
          <p className="text-gray-500">Tell us about your event and our team will get in touch.</p>
        </div>
        
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-b border-gray-300 pb-2">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Name</label>
              <input type="text" className="w-full outline-none bg-transparent" placeholder="John Doe" />
            </div>
            <div className="border-b border-gray-300 pb-2">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Phone / WhatsApp</label>
              <input type="text" className="w-full outline-none bg-transparent" placeholder="+231..." />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-b border-gray-300 pb-2">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Event Type</label>
              <select className="w-full outline-none bg-transparent appearance-none">
                <option>Birthday</option>
                <option>Corporate</option>
                <option>Wedding</option>
                <option>Other Party</option>
              </select>
            </div>
            <div className="border-b border-gray-300 pb-2">
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Estimated Guests</label>
              <input type="number" className="w-full outline-none bg-transparent" placeholder="e.g. 50" />
            </div>
          </div>
          
          <div className="border-b border-gray-300 pb-2">
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Preferred Date</label>
            <input type="date" className="w-full outline-none bg-transparent" />
          </div>
          
          <div className="border-b border-gray-300 pb-2">
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Message Details</label>
            <textarea rows={4} className="w-full outline-none bg-transparent" placeholder="Any special requests or details..."></textarea>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <button type="submit" className="flex-1 px-8 py-4 bg-[#1A1A1A] text-white uppercase tracking-widest text-sm hover:bg-[#2B4B5C] transition-colors">
              Send Event Request
            </button>
            <Link href="https://wa.me/23100000000" className="flex-1 px-8 py-4 border border-[#1A1A1A] text-[#1A1A1A] uppercase tracking-widest text-sm text-center hover:bg-[#1A1A1A] hover:text-white transition-colors">
              Chat on WhatsApp
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

const GallerySection = () => {
  return (
    <section id="gallery" className="py-24 bg-[#FAFAF7] px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-serif text-center mb-16">MOMENTS AT KWALEE</h2>
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
          <img src={placeholder("1507525428034-b723cf961d3e", 600, 800)} className="w-full rounded-sm" alt="Gallery" />
          <img src={placeholder("1576013462273-d1a460851ec0", 600, 600)} className="w-full rounded-sm" alt="Gallery" />
          <img src={placeholder("1544148103-0773bf10d330", 600, 900)} className="w-full rounded-sm" alt="Gallery" />
          <img src={placeholder("1514362545857-3bc16c4c7d1b", 600, 500)} className="w-full rounded-sm" alt="Gallery" />
          <img src={placeholder("1511795409834-ef04bbd61620", 600, 700)} className="w-full rounded-sm" alt="Gallery" />
          <img src={placeholder("1582719508461-905c673771fd", 600, 600)} className="w-full rounded-sm" alt="Gallery" />
        </div>
      </div>
    </section>
  );
}

const FinalCTA = () => {
  return (
    <section className="relative h-[80vh] flex items-center justify-center text-center px-6">
      <div className="absolute inset-0 z-0">
        <img 
          src={placeholder(IMAGES.sunset)} 
          alt="Sunset at Kwalee" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 max-w-2xl text-white">
        <h2 className="text-5xl md:text-7xl font-serif mb-8 leading-[1.1]">
          YOUR ESCAPE<br/>STARTS HERE.
        </h2>
        <p className="text-xl font-light mb-12 opacity-90">Come for the beach. Stay for the experience.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#book" className="px-8 py-4 bg-white text-[#1A1A1A] uppercase tracking-widest text-sm hover:bg-[#E8E1D7] transition-colors">
            Book Your Stay
          </Link>
          <Link href="#inquiry" className="px-8 py-4 border border-white text-white uppercase tracking-widest text-sm hover:bg-white hover:text-[#1A1A1A] transition-colors">
            Plan An Event
          </Link>
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  return (
    <main className="font-sans text-[#1A1A1A] bg-[#FAFAF7] selection:bg-[#E8E1D7] selection:text-[#1A1A1A]">
      <Navbar />
      <Hero />
      <BookingBarInteractive />
      <IntroSection />
      
      <FeatureSection 
        id="beach"
        label="The Beach"
        title="YOUR PLACE BY THE OCEAN."
        text="Whether you're looking for a quiet afternoon by the water, time with friends or an unforgettable celebration, the beach is at the heart of the Kwalee experience."
        image={placeholder(IMAGES.beach)}
        cta="Explore the Beach"
      />
      
      <FeatureSection 
        id="pool"
        label="The Pool"
        title="TAKE A DIP. STAY A LITTLE LONGER."
        text="Take a refreshing swim, relax beside the water and spend the afternoon doing absolutely nothing. Enjoy poolside service, comfortable loungers, and perfect coastal temperatures."
        image={placeholder(IMAGES.pool)}
        reverse={true}
      />
      
      <FeatureSection 
        id="bar"
        label="The Bar"
        title="GOOD DRINKS. GOOD PEOPLE. GOOD TIMES."
        text="Cold drinks, good company and the perfect setting for sunset. Our coastal bar offers signature cocktails, mocktails, and a curated selection of beverages."
        image={placeholder(IMAGES.bar)}
        cta="Discover the Bar"
      />
      
      <FeatureSection 
        id="dining"
        label="Dining"
        title="TASTE THE COAST."
        text="Enjoy fresh food and drinks in a relaxed coastal atmosphere. Our restaurant features local and international flavors crafted with care, perfect for a sunset dinner."
        image={placeholder(IMAGES.dining)}
        reverse={true}
        cta="View Dining"
      />
      
      <ServicesSection />
        <CoverflowTestimonialsSection />
      <EventsSection />
      <EventInquiryForm />
      <GallerySection />
      
      <section className="py-24 bg-white text-center px-6">
        <span className="text-xs uppercase tracking-[0.2em] text-[#4A5D4E] block mb-12">Social Proof</span>
        <h2 className="text-3xl md:text-4xl font-serif text-[#1A1A1A] mb-12">WHAT OUR GUESTS SAY</h2>
        <p className="text-gray-500 italic max-w-2xl mx-auto">"[GUEST REVIEWS COMING SOON]"</p>
      </section>
      
      <FinalCTA />
      <Footer />
    </main>
  );
}
