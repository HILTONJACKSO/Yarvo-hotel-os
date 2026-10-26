import { WebsiteContent } from '@/types/cms';

export const DEFAULT_CMS_CONTENT: WebsiteContent = {
  hero: {
    subtitle: "Liberia • West African Coast",
    title: "WHERE THE OCEAN\nMEETS YOUR ESCAPE.",
    description: "Discover the beauty of Kwalee Beach Resort — where the beach, pool, dining, events and coastal atmosphere come together for an unforgettable experience.",
    bgImage: "/uploads/1792690524951-661832220-1001926674.webp",
    bookButtonText: "Book Your Stay",
    bookButtonLink: "#book",
    exploreButtonText: "Explore the Resort",
    exploreButtonLink: "#experience",
  },
  about: {
    badge: "About Us",
    title: "A Place to Slow Down.\nStay Better, Travel Happier.",
    description: "Escape to a coastal destination where days are shaped by the rhythm of the ocean, warm hospitality, good food, refreshing swims and unforgettable moments by the beach.",
    buttonText: "Read More",
    buttonLink: "#gallery",
    mainImage: "/uploads/1792605825669-760395842-image12.jpeg",
    mainImageTitle: "Ocean Room",
    mainImageSubtitle: "Wake up to the sound of waves",
    secondaryImage: "/uploads/1792605863417-88439173-image1.jpeg",
  },
  features: {
    beach: {
      label: "The Beach",
      title: "YOUR PLACE BY THE OCEAN.",
      description: "Whether you're looking for a quiet afternoon by the water, time with friends or an unforgettable celebration, the beach is at the heart of the Kwalee experience.",
      image: "/uploads/1792614827259-96739526-1001923944.jpg",
      cta: "Explore the Beach",
      ctaHref: "/#gallery",
    },
    pool: {
      label: "The Pool",
      title: "TAKE A DIP. STAY A LITTLE LONGER.",
      description: "Take a refreshing swim, relax beside the water and spend the afternoon doing absolutely nothing. Enjoy poolside service, comfortable loungers, and perfect coastal temperatures.",
      image: "/uploads/1792608314097-589818625-FB_IMG_1791274719751.jpg",
      cta: "Explore the Pool",
      ctaHref: "/#experience",
    },
    bar: {
      label: "The Bar",
      title: "GOOD DRINKS. GOOD PEOPLE. GOOD TIMES.",
      description: "Cold drinks, good company and the perfect setting for sunset. Our coastal bar offers signature cocktails, mocktails, and a curated selection of beverages.",
      image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80",
      cta: "Discover the Bar",
      ctaHref: "/dining",
    },
    dining: {
      label: "Dining",
      title: "TASTE THE COAST.",
      description: "Enjoy fresh food and drinks in a relaxed coastal atmosphere. Our restaurant features local and international flavors crafted with care, perfect for a sunset dinner.",
      image: "/uploads/1792608893243-595835822-FB_IMG_1791274755210.jpg",
      cta: "View Dining",
      ctaHref: "/dining",
    },
  },
  rooms: {
    badge: "POPULAR SERVICES",
    title: "Services Built For\nTravelers.",
    description: "Kwalee provides smart tools, secure payments, verified reviews, ensuring smooth, confident, and effortless hotel booking.",
    stayRoomsTitle: "Luxury Rooms & Suites",
    stayRoomsDescription: "Wake up to the sound of waves in our meticulously designed rooms, offering breathtaking views and premium amenities.",
    stayTentsTitle: "Glamping Tents",
    stayTentsDescription: "Immerse yourself in nature without sacrificing comfort in our premium beachfront tents.",
    items: [
      {
        id: "room-1",
        name: "Oceanfront Double Tent",
        type: "tent",
        location: "Kpakpa Kon, Marshall, Liberia",
        features: "2 Bed • 2 Bath",
        price: "$35/night",
        rating: "4.8",
        description: "Beachfront glamping tent with ocean breeze, comfortable double beds, private bathroom, and direct beach access.",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        bookUrl: "/stay"
      },
      {
        id: "room-2",
        name: "Family Triple Tent",
        type: "tent",
        location: "Kpakpa Kon, Marshall, Liberia",
        features: "3 Bed • 2 Bath",
        price: "$45/night",
        rating: "4.8",
        description: "Spacious triple glamping tent designed for families or groups, blending coastal nature with modern luxury.",
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
        bookUrl: "/stay"
      },
      {
        id: "room-3",
        name: "Deluxe Family Suite",
        type: "room",
        location: "Kpakpa Kon, Marshall, Liberia",
        features: "4 Bed • 3 Bath",
        price: "$120/night",
        rating: "4.9",
        description: "Expansive premium oceanview suite with private terrace, king beds, deluxe amenities, and VIP room service.",
        image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
        bookUrl: "/stay"
      }
    ]
  },
  coverflow: [
    { id: "slide-1", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", title: "Ocean Breeze", subtitle: "Relaxation at its best." },
    { id: "slide-2", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80", title: "Evening Cocktails", subtitle: "Toast to the sunset." },
    { id: "slide-3", image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1600&q=80", title: "Festive Grand\nInterior", subtitle: "Adventure is never far away." },
    { id: "slide-4", image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80", title: "Unforgettable\nEvents", subtitle: "Celebrate your moments." },
    { id: "slide-5", image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80", title: "Luxury Suites", subtitle: "Stay in comfort." },
  ],
  testimonials: {
    badge: "Testimonials",
    title: "What Our\nGuests Say",
    description: "Experience Kwalee Beach Resort through the eyes of those who have stayed with us. We take pride in delivering unforgettable moments and exceptional coastal hospitality.",
    ratingScore: "4.8/5",
    ratingCount: "from 2,800+ reviews",
    items: [
      {
        id: "test-1",
        author: "Karar Mahmud",
        source: "TripAdvisor",
        rating: "4.80",
        text: "Brilliant staff and exceptional customer service. The place is fantastic. Great facilities and atmosphere. Buffet breakfast daily is very generous.",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      {
        id: "test-2",
        author: "Sarah Jenkins",
        source: "Google Reviews",
        rating: "5.00",
        text: "An unforgettable experience! The oceanfront tents were amazing and the service was absolutely top-notch. Highly recommended for couples.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      {
        id: "test-3",
        author: "Michael Chen",
        source: "Booking.com",
        rating: "4.90",
        text: "The dining experience was out of this world. Fresh seafood and perfectly crafted cocktails. We will definitely be coming back next year.",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      }
    ]
  },
  events: {
    badge: "Events & Gatherings",
    title: "YOUR MOMENT.\nYOUR PEOPLE.\nYOUR BEACH.",
    description: "From birthdays and private celebrations to corporate gatherings, parties and special occasions, Kwalee Beach Resort provides a memorable coastal setting for events.",
    highlights: [
      "Romantic Heartshape Beach Dinners",
      "Romantic Poolside Candlelight Dinners",
      "Coastal Jazz & Live Music Nights",
      "Beachfront Karaoke & Big Screen Movie Nights",
      "Sunset Bonfires, Music & Celebrations"
    ],
    buttonText: "Plan Your Event",
    buttonLink: "#inquiry",
    image: "/uploads/1792691162950-191268538-1001926702.webp"
  },
  inquiry: {
    badge: "Plan With Us",
    title: "Event Inquiry",
    description: "Tell us about your upcoming event and our dedicated team will get in touch to bring your vision to life.",
    submitButtonText: "Send Request",
    whatsappButtonText: "Chat on WhatsApp",
    whatsappNumber: "+231774340843"
  },
  gallery: {
    title: "MOMENTS AT KWALEE",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576013462273-d1a460851ec0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61620?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
    ]
  },
  finalCta: {
    title: "YOUR ESCAPE\nSTARTS HERE.",
    subtitle: "Come for the beach. Stay for the experience.",
    bgImage: "/uploads/1792690524951-661832220-1001926674.webp",
    button1Text: "Book Your Stay",
    button1Link: "#book",
    button2Text: "Plan An Event",
    button2Link: "#inquiry"
  },
  subpages: {
    stay: {
      badge: "Accommodations",
      title: "Stay With Us",
      description: "Experience unparalleled luxury in our oceanfront rooms and glamping tents.",
      bgImage: "/uploads/1792622079023-234476382-image12.jpeg"
    },
    dining: {
      badge: "Exquisite Flavors",
      title: "Dining at Kwalee",
      description: "Experience our curated digital menu and have culinary excellence delivered straight to your room.",
      bgImage: "/uploads/1792609423276-45157749-FB_IMG_1791274730855.jpg"
    },
    events: {
      badge: "Events & Gatherings",
      title: "Our Event Spaces & Experiences",
      description: "Private beach dinners, live jazz, karaoke, starlight movie nights, and coastal celebrations.",
      bgImage: "/uploads/1792691162950-191268538-1001926702.webp"
    },
    tours: {
      badge: "Coastal Adventures",
      title: "Resort Activities & Tours",
      description: "Explore the breathtaking Liberian coast, ocean excursions, and guided activities.",
      bgImage: "/uploads/1792609527914-295451027-images.jpeg"
    }
  },
  general: {
    resortName: "Kwalee Beach Resort",
    tagline: "A premium coastal destination offering beach relaxation, poolside experiences, dining, and unforgettable events.",
    logoUrl: "/uploads/1792592361539-240038038-1001106563.png",
    phone: "+231 881 744 350",
    email: "kwaleebeachresort1@gmail.com",
    address: "Kpakpa Kon, Marshall, Liberia",
    instagramUrl: "https://www.instagram.com/kwaleebeachresort?psln=MWp2a3ppdzF5cHB3Zw==",
    facebookUrl: "https://www.facebook.com/share/1DbCs4wZAb/",
    whatsappNumber: "+231774340843",
    copyrightText: "© 2026 Kwalee Beach Resort. All rights reserved.",
    navLinks: [
      { label: "Stay", href: "/stay" },
      { label: "Beach", href: "/#beach" },
      { label: "Pool", href: "/#pool" },
      { label: "Dining", href: "/dining" },
      { label: "Events", href: "/events" },
      { label: "Gallery", href: "/#gallery" },
      { label: "Contact", href: "/#contact" }
    ]
  }
};

/**
 * Deeply merges custom content into the default CMS content to ensure complete type safety
 * even if stored JSON is partial or missing newly introduced fields.
 */
export function mergeWithDefaultContent(input: any): WebsiteContent {
  if (!input || typeof input !== 'object') {
    return DEFAULT_CMS_CONTENT;
  }

  return {
    hero: { ...DEFAULT_CMS_CONTENT.hero, ...(input.hero || {}) },
    about: { ...DEFAULT_CMS_CONTENT.about, ...(input.about || {}) },
    features: {
      beach: { ...DEFAULT_CMS_CONTENT.features.beach, ...(input.features?.beach || {}) },
      pool: { ...DEFAULT_CMS_CONTENT.features.pool, ...(input.features?.pool || {}) },
      bar: { ...DEFAULT_CMS_CONTENT.features.bar, ...(input.features?.bar || {}) },
      dining: { ...DEFAULT_CMS_CONTENT.features.dining, ...(input.features?.dining || {}) },
    },
    rooms: {
      ...DEFAULT_CMS_CONTENT.rooms,
      ...(input.rooms || {}),
      items: Array.isArray(input.rooms?.items) && input.rooms.items.length > 0
        ? input.rooms.items
        : DEFAULT_CMS_CONTENT.rooms.items
    },
    coverflow: Array.isArray(input.coverflow) && input.coverflow.length > 0
      ? input.coverflow
      : DEFAULT_CMS_CONTENT.coverflow,
    testimonials: {
      ...DEFAULT_CMS_CONTENT.testimonials,
      ...(input.testimonials || {}),
      items: Array.isArray(input.testimonials?.items) && input.testimonials.items.length > 0
        ? input.testimonials.items
        : DEFAULT_CMS_CONTENT.testimonials.items
    },
    events: {
      ...DEFAULT_CMS_CONTENT.events,
      ...(input.events || {}),
      highlights: Array.isArray(input.events?.highlights) && input.events.highlights.length > 0
        ? input.events.highlights
        : DEFAULT_CMS_CONTENT.events.highlights
    },
    inquiry: { ...DEFAULT_CMS_CONTENT.inquiry, ...(input.inquiry || {}) },
    gallery: {
      ...DEFAULT_CMS_CONTENT.gallery,
      ...(input.gallery || {}),
      images: Array.isArray(input.gallery?.images) && input.gallery.images.length > 0
        ? input.gallery.images
        : DEFAULT_CMS_CONTENT.gallery.images
    },
    finalCta: { ...DEFAULT_CMS_CONTENT.finalCta, ...(input.finalCta || {}) },
    subpages: {
      stay: { ...DEFAULT_CMS_CONTENT.subpages.stay, ...(input.subpages?.stay || {}) },
      dining: { ...DEFAULT_CMS_CONTENT.subpages.dining, ...(input.subpages?.dining || {}) },
      events: { ...DEFAULT_CMS_CONTENT.subpages.events, ...(input.subpages?.events || {}) },
      tours: { ...DEFAULT_CMS_CONTENT.subpages.tours, ...(input.subpages?.tours || {}) },
    },
    general: {
      ...DEFAULT_CMS_CONTENT.general,
      ...(input.general || {}),
      navLinks: Array.isArray(input.general?.navLinks) && input.general.navLinks.length > 0
        ? input.general.navLinks
        : DEFAULT_CMS_CONTENT.general.navLinks
    }
  };
}
