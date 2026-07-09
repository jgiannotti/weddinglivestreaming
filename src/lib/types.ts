export type ListingTier = 'basic' | 'featured';
export type ListingStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'couple' | 'vendor' | 'admin';
export type SubscriptionPlan = 'monthly' | 'annual';
export type PaymentProcessor = 'stripe' | 'paypal';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  bio: string | null;
  websiteUrl: string | null;
  phone: string | null;
  memberSince: string;
}

export interface Listing {
  id: string;
  vendorId: string;
  title: string;
  slug: string;
  description: string;
  heroImageUrl: string | null;
  city: string;
  state: string;
  country: string;
  lat: number | null;
  lng: number | null;
  status: ListingStatus;
  tier: ListingTier;
  featuredUntil: string | null;
  websiteUrl: string | null;
  categories: Category[];
  viewCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  // Milestone 2 — coverage radius / location intelligence
  serviceRadiusMiles: number;
  travelsNationwide: boolean;
  // Only populated by getListingsByLocation() (radius search) — undefined
  // for plain state/category listing queries.
  distanceMiles?: number;
  /** 1 = within the vendor's own radius, 2 = same-state fallback, 3 = travels nationwide */
  searchTier?: 1 | 2 | 3;
  // Joined vendor info
  vendor?: Vendor;
}

export interface ListingPhoto {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
}

export interface Message {
  id: string;
  fromUserId: string;
  toVendorId: string;
  listingId: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface Favorite {
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  vendorId: string;
  processor: PaymentProcessor;
  externalId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
}
