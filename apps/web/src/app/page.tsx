"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Menu, X, MapPin, Phone, Mail, Instagram, Facebook, 
  ChevronRight, Calendar, Users, Home as HomeIcon, Check
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
  hero: "1499793983690-e29da59ef1c2", // Beach sunset/resort
  intro: "1540541338-8c27379d201b", // Relaxation
  beach: "1507525428034-b723cf961d3e", // Beach 
  pool: "1576013462273-d1a460851ec0", // Pool
  bar: "1514362545857-3bc16c4c7d1b", // Drinks
  dining: "1544148103-0773bf10d330", // Restaurant
  events: "1511795409834-ef04bbd61620", // Event
  rooms: {
    r1: "1582719508461-905c673771fd", // Room 1
    r2: "1590490360182-c33d5773342b", // Room 2
  },
  sunset: "1507525428034-b723cf961d3e"
};

// ==========================================
// 2. COMPONENTS
// ==========================================

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Stay", href: "#stay" },
    { label: "Beach", href: "#beach" },
    { label: "Pool", href: "#pool" },
    { label: "Dining", href: "#dining" },
    { label: "Events", href: "#events" },
    { label: "Gallery", href: "#gallery" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        isScrolled ? "bg-[#FAFAF7] text-[#1A1A1A] py-4 shadow-sm" : "bg-transparent text-white py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="font-serif text-xl tracking-widest uppercase font-bold">
          Kwalee
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm tracking-widest uppercase">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="hover:opacity-60 transition-opacity">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA & MOBILE TOGGLE */}
        <div className="flex items-center space-x-6">
          <Link 
            href="#book" 
            className={`hidden md:inline-block px-6 py-3 text-xs tracking-widest uppercase border transition-colors ${
              isScrolled 
                ? "border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FAFAF7]" 
                : "border-white text-white hover:bg-white hover:text-[#1A1A1A]"
            }`}
          >
            Book Now
          </Link>
          <button 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#FAFAF7] text-[#1A1A1A] shadow-xl flex flex-col p-6 space-y-6">
          {navLinks.map((link) => (
            <Link 
              key={link.label} 
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-serif uppercase tracking-widest border-b border-[#E8E1D7] pb-4"
            >
              {link.label}
            </Link>
          ))}
          <Link 
            href="#book" 
            onClick={() => setMobileMenuOpen(false)}
            className="bg-[#1A1A1A] text-[#FAFAF7] text-center py-4 uppercase tracking-widest text-sm"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
};

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

const BookingBar = () => {
  return (
    <section id="book" className="relative z-20 -mt-16 max-w-6xl mx-auto px-6">
      <div className="bg-white shadow-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 border-b md:border-b-0 md:border-r border-[#E8E1D7] pb-6 md:pb-0 md:pr-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Check-in — Check-out</label>
            <div className="flex items-center gap-3 border-b border-[#1A1A1A] py-2">
              <Calendar size={18} className="text-gray-400" />
              <input type="text" placeholder="Select Dates" className="w-full bg-transparent outline-none text-[#1A1A1A]" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Guests</label>
            <div className="flex items-center gap-3 border-b border-[#1A1A1A] py-2">
              <Users size={18} className="text-gray-400" />
              <select className="w-full bg-transparent outline-none text-[#1A1A1A] appearance-none">
                <option>2 Adults, 0 Children</option>
                <option>1 Adult</option>
                <option>2 Adults, 1 Child</option>
                <option>Group / Event</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Accommodation</label>
            <div className="flex items-center gap-3 border-b border-[#1A1A1A] py-2">
              <HomeIcon size={18} className="text-gray-400" />
              <select className="w-full bg-transparent outline-none text-[#1A1A1A] appearance-none">
                <option>All Rooms & Tents</option>
                <option>Double Tent</option>
                <option>Triple Tent</option>
              </select>
            </div>
          </div>
        </div>
        <div className="w-full md:w-auto flex-shrink-0">
          <Link href="https://wa.me/23100000000" target="_blank" className="block w-full px-8 py-5 bg-[#1A1A1A] text-white uppercase tracking-widest text-sm text-center hover:bg-[#2B4B5C] transition-colors">
            Check Availability
          </Link>
        </div>
      </div>
    </section>
  );
};

const IntroSection = () => {
  return (
    <section id="experience" className="px-6 py-24 md:py-40 max-w-7xl mx-auto flex flex-col items-center">
      {/* Top Centered Heading to match design */}
      <div className="text-center mb-16 md:mb-24">
        <h2 className="text-4xl md:text-6xl lg:text-[72px] font-sans font-bold text-[#1A1A1A] leading-tight max-w-4xl mx-auto tracking-tight">
          Kwalee's Rooms & Suites<br/>More Than Just A Stay.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-start w-full">
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
        
        <div className="order-1 lg:order-2 grid grid-cols-3 gap-3 md:gap-5 h-[400px] md:h-[500px] lg:h-[600px] w-full">
          <div className="flex flex-col h-full w-full">
            <div className="relative rounded-2xl overflow-hidden h-[85%] mt-0 shadow-lg group cursor-pointer">
              <img 
                src={placeholder(IMAGES.rooms.r1)} 
                alt="Room" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="mt-4 px-1">
              <h4 className="font-semibold text-lg text-gray-900">Ocean Room</h4>
              <p className="text-xs text-gray-500 mt-1">Wake up to the sound of waves</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-[85%] mt-[15%] shadow-lg group cursor-pointer w-full">
            <img 
              src={placeholder(IMAGES.rooms.r2)} 
              alt="Room" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="relative rounded-2xl overflow-hidden h-[85%] mt-[30%] shadow-lg group cursor-pointer w-full bg-gray-900">
            <img 
              src={placeholder(IMAGES.intro)} 
              alt="Room" 
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
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

const AccommodationSection = () => {
  const rooms = [
    {
      name: "Oceanfront Double Tent",
      desc: "Experience the ultimate coastal glamping right on the beach.",
      details: "2 Guests • 1 Double Bed • Ocean View",
      img: placeholder(IMAGES.rooms.r1)
    },
    {
      name: "Family Triple Tent",
      desc: "Spacious comfort designed for families or small groups.",
      details: "3 Guests • 3 Single Beds • Garden View",
      img: placeholder(IMAGES.rooms.r2)
    }
  ];

  return (
    <section id="stay" className="py-24 md:py-40 px-6 md:px-12 bg-[#F5F5F0]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 md:w-1/2">
          <span className="text-xs uppercase tracking-[0.2em] text-[#4A5D4E] block mb-6">Accommodation</span>
          <h2 className="text-4xl md:text-6xl font-serif text-[#1A1A1A] leading-[1.1]">
            STAY BY THE SEA.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {rooms.map((room, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-[4/3] mb-8 overflow-hidden">
                <img 
                  src={room.img} 
                  alt={room.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="text-2xl font-serif mb-4">{room.name}</h3>
              <p className="text-gray-600 font-light mb-6">{room.desc}</p>
              <div className="flex justify-between items-center border-t border-[#E8E1D7] pt-6">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{room.details}</span>
                <Link href="#book" className="text-sm uppercase tracking-widest font-semibold flex items-center gap-2 group-hover:text-[#4A5D4E]">
                  View Room <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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

const Footer = () => {
  return (
    <footer id="contact" className="bg-[#1A1A1A] text-white pt-24 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-white/20 pb-16 mb-12">
        <div className="md:col-span-1">
          <h3 className="font-serif text-2xl tracking-widest uppercase mb-8">Kwalee<br/>Beach<br/>Resort</h3>
          <p className="text-sm opacity-60 font-light leading-relaxed">
            A premium coastal destination offering beach relaxation, poolside experiences, dining, and unforgettable events.
          </p>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#E8E1D7]">Navigation</h4>
          <ul className="space-y-4 text-sm font-light opacity-80">
            <li><Link href="#stay" className="hover:text-white transition-colors">Stay</Link></li>
            <li><Link href="#beach" className="hover:text-white transition-colors">Beach</Link></li>
            <li><Link href="#pool" className="hover:text-white transition-colors">Pool</Link></li>
            <li><Link href="#dining" className="hover:text-white transition-colors">Dining</Link></li>
            <li><Link href="#events" className="hover:text-white transition-colors">Events</Link></li>
            <li><Link href="#gallery" className="hover:text-white transition-colors">Gallery</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#E8E1D7]">Contact</h4>
          <ul className="space-y-4 text-sm font-light opacity-80">
            <li className="flex items-center gap-3"><Phone size={16} /> [RESORT PHONE]</li>
            <li className="flex items-center gap-3"><Mail size={16} /> [RESORT EMAIL]</li>
            <li className="flex items-start gap-3"><MapPin size={16} className="mt-1 flex-shrink-0" /> Liberia, West African Coast</li>
          </ul>
          <div className="flex gap-6 mt-8">
            <a href="#" className="opacity-60 hover:opacity-100 transition-opacity"><Instagram size={20} /></a>
            <a href="#" className="opacity-60 hover:opacity-100 transition-opacity"><Facebook size={20} /></a>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#E8E1D7]">Newsletter</h4>
          <p className="text-sm opacity-60 font-light mb-6">Stay connected with Kwalee.</p>
          <form className="flex border-b border-white/30 pb-2">
            <input type="email" placeholder="Your email" className="w-full bg-transparent outline-none text-sm placeholder:text-white/40" />
            <button type="submit" className="text-xs uppercase tracking-widest font-semibold ml-4 hover:text-[#E8E1D7]">Join</button>
          </form>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs opacity-40 font-light uppercase tracking-widest">
        <p>© {new Date().getFullYear()} Kwalee Beach Resort. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="/login" className="hover:text-white transition-colors">Staff Login</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

// ==========================================
// 3. MAIN PAGE
// ==========================================

export default function LandingPage() {
  return (
    <main className="font-sans text-[#1A1A1A] bg-[#FAFAF7] selection:bg-[#E8E1D7] selection:text-[#1A1A1A]">
      <Navbar />
      <Hero />
      <BookingBar />
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
      
      <AccommodationSection />
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
