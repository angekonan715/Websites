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
