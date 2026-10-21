"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';
import { GeneralContent } from '@/types/cms';
import { DEFAULT_CMS_CONTENT } from '@/lib/default-cms-content';

interface FooterProps {
  general?: GeneralContent;
}

const Footer = ({ general }: FooterProps) => {
  const [data, setData] = useState<GeneralContent>(general || DEFAULT_CMS_CONTENT.general);

  useEffect(() => {
    if (general) {
      setData(general);
      return;
    }
    fetch('/api/cms', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.general) {
          setData(json.data.general);
        }
      })
      .catch(() => {});
  }, [general]);

  const navLinks = data.navLinks && data.navLinks.length > 0
    ? data.navLinks
    : DEFAULT_CMS_CONTENT.general.navLinks;

  return (
    <footer id="contact" className="bg-[#1F1F1F] text-white pt-24 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-white/20 pb-16 mb-12">
        <div className="md:col-span-1">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt={data.resortName} className="h-10 max-w-[200px] object-contain mb-6 invert brightness-200" />
          ) : (
            <h3 className="font-serif text-2xl tracking-widest uppercase mb-8 whitespace-pre-line">
              {data.resortName || 'Kwalee\nBeach\nResort'}
            </h3>
          )}
          <p className="text-sm opacity-60 font-light leading-relaxed">
            {data.tagline || 'A premium coastal destination offering beach relaxation, poolside experiences, dining, and unforgettable events.'}
          </p>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#FAF9F4]/70">Navigation</h4>
          <ul className="space-y-4 text-sm font-light opacity-80">
            {navLinks.map((link, idx) => (
              <li key={idx}>
                <Link href={link.href} className="hover:text-[#F5A623] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#FAF9F4]/70">Contact</h4>
          <ul className="space-y-4 text-sm font-light opacity-80">
            {data.phone && (
              <li className="flex items-center gap-3">
                <Phone size={16} /> 
                <a href={`tel:${data.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[#F5A623] transition-colors">
                  {data.phone}
                </a>
              </li>
            )}
            {data.email && (
              <li className="flex items-center gap-3">
                <Mail size={16} /> 
                <a href={`mailto:${data.email}`} className="hover:text-[#F5A623] transition-colors">
                  {data.email}
                </a>
              </li>
            )}
            {data.address && (
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 flex-shrink-0" /> 
                <span>{data.address}</span>
              </li>
            )}
          </ul>
          
          <div className="flex gap-6 mt-8">
            {data.instagramUrl && (
              <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <Instagram size={20} />
              </a>
            )}
            {data.facebookUrl && (
              <a href={data.facebookUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <Facebook size={20} />
              </a>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] mb-8 text-[#FAF9F4]/70">Newsletter</h4>
          <p className="text-sm opacity-60 font-light mb-6">Stay connected with Kwalee.</p>
          <form className="flex border-b border-white/30 pb-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email" 
              className="w-full bg-transparent outline-none text-sm placeholder:text-white/40" 
            />
            <button type="submit" className="text-xs uppercase tracking-widest font-semibold ml-4 hover:text-[#FAF9F4]/70">
              Join
            </button>
          </form>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs opacity-40 font-light uppercase tracking-widest">
        <p>{data.copyrightText || `© ${new Date().getFullYear()} Kwalee Beach Resort. All rights reserved.`}</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="/login" className="hover:text-[#F5A623] transition-colors">Staff Login</Link>
          <Link href="/privacy" className="hover:text-[#F5A623] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#F5A623] transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
