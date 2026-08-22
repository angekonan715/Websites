import type { Destination, Reservation, ReservationStatus } from "./types";

/** Seats are taken only after the booking is confirmed (payment or appointment). */
const CONFIRMED_STATUSES: ReservationStatus[] = [
  "payment_received",
  "confirmed",
];

export const DEFAULT_CAPACITY = 20;

export function destinationCapacity(destination: Pick<Destination, "capacity">) {
  const value = Number(destination.capacity);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_CAPACITY;
}

export function bookedPlacesFor(
  reservations: Reservation[],
  destinationId: string,
  excludeId?: string
) {
  return reservations.reduce((total, item) => {
    if (item.destinationId !== destinationId) return total;
    if (excludeId && item.id === excludeId) return total;
    if (!CONFIRMED_STATUSES.includes(item.status)) return total;
    return total + Math.max(0, item.travelers);
  }, 0);
}

export function availablePlaces(capacity: number, booked: number) {
  return Math.max(0, capacity - booked);
}

export function withAvailability(
  destination: Destination,
  reservations: Reservation[]
): Destination {
  const capacity = destinationCapacity(destination);
  const bookedPlaces = bookedPlacesFor(reservations, destination.id);
  return {
    ...destination,
    capacity,
    bookedPlaces,
    availablePlaces: availablePlaces(capacity, bookedPlaces),
  };
}

export function persistDestination(destination: Destination): Destination {
  return {
    id: destination.id,
    country: destination.country,
    title: destination.title,
    duration: destination.duration,
    price: destination.price,
    rating: destination.rating,
    reviews: destination.reviews,
    image: destination.image,
    video: destination.video,
    gallery: destination.gallery,
    description: destination.description,
    capacity: destinationCapacity(destination),
  };
}

export function placesLabel(available: number) {
  if (available <= 0) return "Complet";
  if (available === 1) return "1 place disponible";
  return `${available} places disponibles`;
}
