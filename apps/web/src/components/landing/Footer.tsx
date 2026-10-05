
"use client";
import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-[#F5A623] text-[#1A1A1A] pt-24 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-[#1A1A1A]/20 pb-16 mb-12">
        <div className="md:col-span-1">
          <h3 className="font-serif text-2xl tracking-widest uppercase mb-8">Kwalee<br/>Beach<br/>Resort</h3>
          <p className="text-sm opacity-60 font-light leading-relaxed">
            A premium coastal destination offering beach relaxation, poolside experiences, dining, and unforgettable events.
          </p>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#1A1A1A]/70">Navigation</h4>
          <ul className="space-y-4 text-sm font-light opacity-80">
            <li><Link href="/stay" className="hover:text-white transition-colors">Stay</Link></li>
            <li><Link href="/#beach" className="hover:text-white transition-colors">Beach</Link></li>
            <li><Link href="/#pool" className="hover:text-white transition-colors">Pool</Link></li>
            <li><Link href="/dining" className="hover:text-white transition-colors">Dining</Link></li>
            <li><Link href="/events" className="hover:text-white transition-colors">Events</Link></li>
            <li><Link href="/#gallery" className="hover:text-white transition-colors">Gallery</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#1A1A1A]/70">Contact</h4>
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
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#1A1A1A]/70">Newsletter</h4>
          <p className="text-sm opacity-60 font-light mb-6">Stay connected with Kwalee.</p>
          <form className="flex border-b border-[#1A1A1A]/30 pb-2">
            <input type="email" placeholder="Your email" className="w-full bg-transparent outline-none text-sm placeholder:text-white/40" />
            <button type="submit" className="text-xs uppercase tracking-widest font-semibold ml-4 hover:text-[#1A1A1A]/70">Join</button>
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


export { Footer };
