"use client";

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';
import { WebsiteContent } from '@/types/cms';

export default function PrivacyPolicyPage() {
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

  const customPrivacy = (cmsContent as any)?.legal?.privacyPolicy;

  return (
    <main className="min-h-screen bg-[#FAF9F4] text-[#1F1F1F]">
      <Navbar general={cmsContent.general} />

      <section className="bg-[#1B2418] text-white pt-36 pb-20 px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-[#F5A623] block mb-3 font-semibold">
          Data Protection & Guest Privacy
        </span>
        <h1 className="font-serif text-4xl md:text-6xl mb-4">Privacy Policy</h1>
        <p className="text-white/80 max-w-2xl mx-auto font-light">
          How Kwalee Beach Resort collects, uses, and safeguards your personal information.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="bg-white rounded-2xl border border-[#E8E1D7] shadow-sm p-8 md:p-12 space-y-8 leading-relaxed text-[#333]">
          {customPrivacy ? (
            <div className="whitespace-pre-line text-sm md:text-base leading-relaxed">{customPrivacy}</div>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">1. Information We Collect</h2>
                <p className="text-sm md:text-base text-[#555]">
                  When you book a stay, reserve an event space, place a dining order, or subscribe to our newsletter at Kwalee Beach Resort, we collect only the information needed to serve you—such as your name, email address, phone/WhatsApp number, stay dates, and special requests.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">2. How We Use Your Information</h2>
                <p className="text-sm md:text-base text-[#555]">
                  We use your information to process and confirm reservations via Email and WhatsApp, prepare your accommodation or event space, provide front-desk and hospitality services during your visit, and (if you opt in to our newsletter) send occasional resort updates and special offers.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">3. WhatsApp & Email Communications</h2>
                <p className="text-sm md:text-base text-[#555]">
                  When you request booking confirmation via WhatsApp or Email, we use your provided contact details solely to deliver your reservation reference, stay summary, and guest support. You may unsubscribe from newsletter emails at any time by contacting us.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">4. Data Security & Sharing</h2>
                <p className="text-sm md:text-base text-[#555]">
                  Kwalee Beach Resort does not sell or rent guest personal data to third parties. Access to reservation and billing records is restricted to authorized resort personnel for operational and guest service purposes.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-serif text-2xl text-[#1B2418]">5. Contact Us</h2>
                <p className="text-sm md:text-base text-[#555]">
                  If you have questions about this Privacy Policy or wish to update or remove your contact details, please reach us at{' '}
                  <strong>{cmsContent.general.email || 'kwaleebeachresort1@gmail.com'}</strong> or WhatsApp{' '}
                  <strong>{cmsContent.general.whatsappNumber || '+231 77 434 0843'}</strong>.
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
