"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';
import { WebsiteContent } from '@/types/cms';

export default function TermsOfServicePage() {
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
  }, []);

  const customTerms = (cmsContent as any)?.legal?.termsOfService;

  return (
    <main className="min-h-screen bg-[#FAF9F4] text-[#1F1F1F]">
      <Navbar general={cmsContent.general} />

      <section className="bg-[#1B2418] text-white pt-36 pb-20 px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-[#F5A623] block mb-3 font-semibold">
          Legal & Resort Policies
        </span>
        <h1 className="font-serif text-4xl md:text-6xl mb-4">Terms of Service</h1>
        <p className="text-white/80 max-w-2xl mx-auto font-light">
          Terms and conditions governing reservations, resort facilities, events, and website use at Kwalee Beach Resort.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="bg-white rounded-2xl border border-[#E8E1D7] shadow-sm p-8 md:p-12 space-y-8 leading-relaxed text-[#333]">
          {customTerms ? (
            <div className="whitespace-pre-line text-sm md:text-base leading-relaxed">{customTerms}</div>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">1. Reservations & Bookings</h2>
                <p className="text-sm md:text-base text-[#555]">
                  All room, glamping tent, and event space reservations made through the Kwalee Beach Resort website or reservation desk are subject to availability. Guests must be at least 18 years of age to book accommodation and check in. Valid government-issued photo identification is required upon arrival at the Front Desk.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">2. Check-In, Check-Out & Room Access</h2>
                <p className="text-sm md:text-base text-[#555]">
                  Standard check-in begins at 2:00 PM and check-out is by 12:00 PM (Noon). Early check-in or late check-out requests are subject to availability and may incur additional charges. Regular Rooms, Family Rooms, and Executive Suites include complimentary breakfast, beach access, and swimming pool access (Executive Suites also feature private rooftop pool access).
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">3. Payment & Billing</h2>
                <p className="text-sm md:text-base text-[#555]">
                  Payments may be made via Cash, Mobile Money, Bank Transfer, or Card as supported by the resort. All incidental charges incurred during your stay (including Restaurant, Bar, Room Service, Tours, and Activities) will be posted to your room folio and must be settled in full upon departure unless prior corporate billing arrangements have been approved by management.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">4. Cancellations & Modifications</h2>
                <p className="text-sm md:text-base text-[#555]">
                  To modify or cancel a reservation, please contact Kwalee Beach Resort via WhatsApp at {cmsContent.general.whatsappNumber || '+231 77 434 0843'} or email at {cmsContent.general.email || 'kwaleebeachresort1@gmail.com'} at least 24 hours prior to your scheduled check-in date. Event and banquet bookings may require advance notice as specified in your event agreement.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">5. Resort Facilities, Pool & Beach Safety</h2>
                <p className="text-sm md:text-base text-[#555]">
                  Guests and day-pass visitors must comply with all posted safety rules at the beach, swimming pools, bar, and event areas. Children must be supervised by an adult at all times near the ocean and swimming pools. Kwalee Beach Resort reserves the right to refuse service or revoke facility access for behavior that endangers guests, staff, or property.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">6. Contact Information</h2>
                <p className="text-sm md:text-base text-[#555]">
                  For questions regarding these Terms of Service, please contact Kwalee Beach Resort at{' '}
                  <strong>{cmsContent.general.address || 'Kpakpa Kon, Marshall, Liberia'}</strong>, Phone/WhatsApp:{' '}
                  <strong>{cmsContent.general.phone || '+231 77 434 0843'}</strong>, or Email:{' '}
                  <strong>{cmsContent.general.email || 'kwaleebeachresort1@gmail.com'}</strong>.
                </p>
              </section>
            </>
          )}
        </div>
      </div>

      <Footer general={cmsContent.general} />
    </main>
  );
}
