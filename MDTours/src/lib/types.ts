export interface Destination {
  id: string;
  country: string;
  title: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  video?: string;
  gallery?: string[];
  description?: string;
  capacity: number;
  bookedPlaces?: number;
  availablePlaces?: number;
  promotionEnabled?: boolean;
  promotionLabel?: string;
  promotionPrice?: number;
}

export type AboutBlockType = "heading" | "paragraph" | "image";

export interface AboutBlock {
  id: string;
  type: AboutBlockType;
  text?: string;
  image?: string;
  caption?: string;
}

export interface AboutPage {
  kicker: string;
  title: string;
  subtitle: string;
  blocks: AboutBlock[];
  updatedAt?: string;
}

export interface Campaign {
  id: string;
  message: string;
  href?: string;
  active: boolean;
  createdAt: string;
  expiresAt: string;
}

export type ShareLinkSource = "instagram" | "tiktok" | "facebook" | "whatsapp" | "other";

export interface ShareLink {
  id: string;
  slug: string;
  title: string;
  target: string;
  source: ShareLinkSource;
  active: boolean;
  showOnBio: boolean;
  clicks: number;
  createdAt: string;
  lastClickedAt?: string;
}

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ReservationStatus =
  | "awaiting_contact"
  | "payment_received"
  | "confirmed"
  | "cancelled";

export interface ClientNote {
  id: string;
  notes: string;
  updatedAt: string;
}

export interface ClientTripRecord {
  kind: "reservation" | "custom";
  id: string;
  reference: string;
  title: string;
  departureDate: string;
  travelers: number;
  amount: number;
  paidAmount: number;
  status: string;
  statusLabel: string;
  createdAt: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  bookingCount: number;
  confirmedCount: number;
  travelersTotal: number;
  amountPaid: number;
  amountEngaged: number;
  lastActivityAt: string;
  notes: string;
  currentTripTitle: string;
  currentTripDate: string;
  trips: ClientTripRecord[];
}

export interface Reservation {
  id: string;
  reference: string;
  userId: string;
  destinationId: string;
  destinationTitle: string;
  country: string;
  duration: string;
  image: string;
  name: string;
  email: string;
  phone: string;
  departureDate: string;
  travelers: number;
  unitPrice: number;
  totalPrice: number;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  paymentConfirmedAt?: string;
  appointmentConfirmedAt?: string;
  confirmationEmailSentAt?: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  authorName: string;
  tripTitle: string;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  inviteToken: string;
  createdAt: string;
  images?: string[];
  imageRightsAccepted?: boolean;
  imageRightsAcceptedAt?: string;
}

export interface TestimonyInvite {
  id: string;
  token: string;
  note: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
}

export interface HistoryTrip {
  id: string;
  title: string;
  location: string;
  date: string;
  description: string;
  images: string[];
  video?: string;
  imageRightsConfirmed?: boolean;
  imageRightsConfirmedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export type CustomTripStatus = "pending" | "proposal_sent" | "closed";
export type AccommodationType = "hotel" | "residence";
export type VehicleType = "standard" | "medium" | "premium";

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface PersonalizedQuote {
  nights: number;
  vehicleDays: number;
  travelers: number;
  accommodation: number;
  vehicle: number;
  activities: number;
  total: number;
  breakdown: QuoteLine[];
}

export interface PersonalizedActivity {
  id: string;
  name: string;
  description: string;
  adult: number;
  childUnder12: number;
  childUnder16: number;
}

export interface PersonalizedCity {
  id: string;
  name: string;
  activities: PersonalizedActivity[];
}

export interface PersonalizedCatalog {
  currency: string;
  note: string;
  accommodations: {
    id: AccommodationType;
    label: string;
    description: string;
    adultPerNight?: number;
    childUnder12PerNight?: number;
    childUnder16PerNight?: number;
    nightlyRate?: number;
    includedPeople?: number;
    extraPersonPerNight?: number;
  }[];
  vehicles: {
    id: VehicleType;
    label: string;
    description: string;
    pricePerDay: number;
  }[];
  cities: PersonalizedCity[];
}

export interface CustomTripRequest {
  id: string;
  reference: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  travelKind: string;
  travelKindLabel: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  adults?: number;
  childrenUnder12?: number;
  childrenUnder16?: number;
  accommodation?: AccommodationType;
  vehicle?: VehicleType;
  cities?: string[];
  activityIds?: string[];
  nights?: number;
  quote?: PersonalizedQuote;
  budget: string;
  suggestion: string;
  status: CustomTripStatus;
  proposalTitle?: string;
  proposalDetails?: string;
  proposedPrice?: number;
  proposedDuration?: string;
  quoteEmailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}
