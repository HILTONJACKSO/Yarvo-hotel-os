'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import Image from 'next/image';
import { MapPin, ArrowRight, Compass } from 'lucide-react';
import Link from 'next/link';

export default function ToursPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/v1/public/activities', {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef',
          }
        });
        if (res.ok) {
          const data = await res.json();
          setActivities(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center">
        <Image 
          src="https://images.unsplash.com/photo-1533227260828-531424ed83dc?auto=format&fit=crop&q=80"
          alt="Tours & Experiences"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-serif text-5xl md:text-7xl mb-6">Tours & Experiences</h1>
          <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto">
            Discover the beauty of our surroundings with curated local experiences.
          </p>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-20">Loading experiences...</div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((act) => (
                <div key={act.id} className="group relative overflow-hidden bg-white shadow-md transition-transform hover:-translate-y-1">
                  <div className="relative h-72">
                    <Image 
                      src={act.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80'}
                      alt={act.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 text-sm font-medium tracking-wider">
                      {act.type}
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="font-serif text-2xl mb-2 text-[#1B2418]">{act.name}</h3>
                    <p className="text-amber-700 font-bold mb-4">${Number(act.price).toFixed(2)}</p>
                    <p className="text-[#3A4A36] mb-6 line-clamp-3">
                      {act.description}
                    </p>
                    
                    <Link href="/booking" className="inline-flex items-center text-[#1B2418] font-medium tracking-wide border-b border-[#1B2418] pb-1 hover:text-amber-700 hover:border-amber-700 transition-colors">
                      BOOK DURING STAY <ArrowRight size={18} className="ml-2" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-[#3A4A36]">
              No tours or experiences are available at the moment. Please check back later!
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
