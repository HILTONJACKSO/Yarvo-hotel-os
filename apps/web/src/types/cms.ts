export interface HeroSectionContent {
  subtitle: string;
  title: string;
  description: string;
  bgImage: string;
  bookButtonText: string;
  bookButtonLink: string;
  exploreButtonText: string;
  exploreButtonLink: string;
}

export interface AboutSectionContent {
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  mainImage: string;
  mainImageTitle: string;
  mainImageSubtitle: string;
  secondaryImage: string;
}

export interface FeatureItemContent {
  label: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  ctaHref: string;
}

export interface FeaturesContent {
  beach: FeatureItemContent;
  pool: FeatureItemContent;
  bar: FeatureItemContent;
  dining: FeatureItemContent;
}

export interface CoverflowSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  text: string;
  rating: string;
  source: string;
  avatar: string;
}

export interface TestimonialsContent {
  badge: string;
  title: string;
  description: string;
  ratingScore: string;
  ratingCount: string;
  items: TestimonialItem[];
}

export interface EventSpaceItem {
  id: string;
  name: string;
  image: string;
  description?: string;
  capacity?: number;
  priceText?: string;
}

export interface EventsSectionContent {
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  buttonText: string;
  buttonLink: string;
  image: string;
  spaceImages?: Record<string, string>;
  spaces?: EventSpaceItem[];
}

export interface EventInquiryContent {
  badge: string;
  title: string;
  description: string;
  submitButtonText: string;
  whatsappButtonText: string;
  whatsappNumber: string;
}

export interface MomentsGalleryContent {
  title: string;
  images: string[];
}

export interface FinalCTAContent {
  title: string;
  subtitle: string;
  bgImage: string;
  button1Text: string;
  button1Link: string;
  button2Text: string;
  button2Link: string;
}

export interface SubpageContent {
  badge: string;
  title: string;
  description: string;
  bgImage: string;
}

export interface SubpagesContent {
  stay: SubpageContent;
  dining: SubpageContent;
  events: SubpageContent;
  tours: SubpageContent;
}

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface GeneralContent {
  resortName: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  copyrightText: string;
  navLinks: NavLinkItem[];
}

export interface RoomTentItem {
  id: string;
  name: string;
  type: 'tent' | 'room' | 'suite';
  location: string;
  features: string;
  price: string;
  rating: string;
  description: string;
  image: string;
  bookUrl?: string;
  isBlocked?: boolean;
}

export interface RoomsTentsSectionContent {
  badge: string;
  title: string;
  description: string;
  stayRoomsTitle: string;
  stayRoomsDescription: string;
  stayTentsTitle: string;
  stayTentsDescription: string;
  items: RoomTentItem[];
}

export interface WebsiteContent {
  hero: HeroSectionContent;
  about: AboutSectionContent;
  features: FeaturesContent;
  rooms: RoomsTentsSectionContent;
  coverflow: CoverflowSlide[];
  testimonials: TestimonialsContent;
  events: EventsSectionContent;
  inquiry: EventInquiryContent;
  gallery: MomentsGalleryContent;
  finalCta: FinalCTAContent;
  subpages: SubpagesContent;
  general: GeneralContent;
}
