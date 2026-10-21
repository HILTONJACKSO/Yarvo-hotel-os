"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { GeneralContent } from '@/types/cms';
import { DEFAULT_CMS_CONTENT } from '@/lib/default-cms-content';

interface NavbarProps {
  general?: GeneralContent;
}

const Navbar = ({ general }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navData, setNavData] = useState<GeneralContent>(general || DEFAULT_CMS_CONTENT.general);

  useEffect(() => {
    if (general) {
      setNavData(general);
      return;
    }
    // Fetch if not passed as prop
    fetch('/api/cms', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.general) {
          setNavData(json.data.general);
        }
      })
      .catch(() => {});
  }, [general]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = navData.navLinks && navData.navLinks.length > 0
    ? navData.navLinks
    : DEFAULT_CMS_CONTENT.general.navLinks;

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        isScrolled ? "bg-[#FAF9F4] text-[#1F1F1F] py-4 shadow-sm" : "bg-transparent text-white py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          {navData.logoUrl ? (
            <img 
              src={navData.logoUrl} 
              alt={navData.resortName || 'Kwalee'} 
              className="h-9 max-w-[180px] object-contain" 
            />
          ) : (
            <span className="font-serif text-xl tracking-widest uppercase font-bold">
              {navData.resortName || 'Kwalee'}
            </span>
          )}
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm tracking-widest uppercase">
          {navLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="hover:opacity-60 transition-opacity">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA & MOBILE TOGGLE */}
        <div className="flex items-center space-x-6">
          <Link 
            href="/#book" 
            className={`hidden md:inline-block px-6 py-3 text-xs tracking-widest uppercase border transition-colors ${
              isScrolled 
                ? "border-[#1F1F1F] text-[#1F1F1F] hover:bg-[#1B2418] hover:text-[#FAF9F4]" 
                : "border-white text-white hover:bg-white hover:text-[#1F1F1F]"
            }`}
          >
            Book Now
          </Link>
          <button 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#FAF9F4] text-[#1F1F1F] shadow-xl flex flex-col p-6 space-y-6">
          {navLinks.map((link, idx) => (
            <Link 
              key={idx} 
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-serif uppercase tracking-widest border-b border-[#E8E1D7] pb-4"
            >
              {link.label}
            </Link>
          ))}
          <Link 
            href="/#book" 
            onClick={() => setMobileMenuOpen(false)}
            className="bg-[#1B2418] text-[#FAF9F4] text-center py-4 uppercase tracking-widest text-sm"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
};

export { Navbar };
