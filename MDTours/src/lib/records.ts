import { customTripStatusLabel, reservationStatusLabel } from "@/data/home";
import type {
  ClientNote,
  ClientRecord,
  ClientTripRecord,
  CustomTripRequest,
  Reservation,
  ReservationStatus,
  User,
} from "./types";

export function clientKey(email?: string, phone?: string) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (normalizedEmail) return `email:${normalizedEmail}`;
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits) return `phone:${digits}`;
  return "";
}

export function isPaidReservation(status: ReservationStatus) {
  return status === "payment_received" || status === "confirmed";
}

export function reservationPaidAmount(item: Reservation) {
  return isPaidReservation(item.status) ? item.totalPrice : 0;
}

function customTripAmount(item: CustomTripRequest) {
  return item.proposedPrice || item.quote?.total || 0;
}

function upsertName(current: string, next?: string) {
  const value = next?.trim() ?? "";
  if (!value) return current;
  if (!current || current.length < value.length) return value;
  return current;
}

export function buildClientRecords(
  reservations: Reservation[],
  customTrips: CustomTripRequest[],
  users: User[],
  notes: ClientNote[]
): ClientRecord[] {
  const map = new Map<string, ClientRecord>();
  const noteMap = new Map(notes.map((item) => [item.id, item.notes]));

  function ensure(id: string, seed: { name?: string; email?: string; phone?: string }) {
    const existing = map.get(id);
    if (existing) {
      existing.name = upsertName(existing.name, seed.name);
      existing.email = existing.email || (seed.email?.trim() ?? "");
      existing.phone = existing.phone || (seed.phone?.trim() ?? "");
      return existing;
    }
    const created: ClientRecord = {
      id,
      name: seed.name?.trim() || "Client",
      email: seed.email?.trim() ?? "",
      phone: seed.phone?.trim() ?? "",
      bookingCount: 0,
      confirmedCount: 0,
      travelersTotal: 0,
      amountPaid: 0,
      amountEngaged: 0,
      lastActivityAt: "",
      notes: noteMap.get(id) ?? "",
      currentTripTitle: "",
      currentTripDate: "",
      trips: [],
    };
    map.set(id, created);
    return created;
  }

  function touch(client: ClientRecord, date: string) {
    if (!client.lastActivityAt || date > client.lastActivityAt) {
      client.lastActivityAt = date;
    }
  }

  for (const user of users) {
    if (user.role === "admin") continue;
    const id = clientKey(user.email, "");
    if (!id) continue;
    const client = ensure(id, {
      name: user.name,
      email: user.email,
    });
    touch(client, user.createdAt);
  }

  for (const item of reservations) {
    const id = clientKey(item.email, item.phone);
    if (!id) continue;
    const client = ensure(id, {
      name: item.name,
      email: item.email,
      phone: item.phone,
    });
    const paid = reservationPaidAmount(item);
    const engaged = item.status === "cancelled" ? 0 : item.totalPrice;
    const trip: ClientTripRecord = {
      kind: "reservation",
      id: item.id,
      reference: item.reference,
      title: item.destinationTitle,
      departureDate: item.departureDate,
      travelers: item.travelers,
      amount: item.totalPrice,
      paidAmount: paid,
      status: item.status,
      statusLabel: reservationStatusLabel[item.status] ?? item.status,
      createdAt: item.createdAt,
    };
    client.trips.push(trip);
    client.bookingCount += 1;
    client.travelersTotal += item.travelers;
    client.amountPaid += paid;
    client.amountEngaged += engaged;
    if (item.status === "confirmed") client.confirmedCount += 1;
    touch(client, item.updatedAt || item.createdAt);
  }

  for (const item of customTrips) {
    const id = clientKey(item.email, item.phone);
    if (!id) continue;
    const client = ensure(id, {
      name: item.name,
      email: item.email,
      phone: item.phone,
    });
    const amount = customTripAmount(item);
    const trip: ClientTripRecord = {
      kind: "custom",
      id: item.id,
      reference: item.reference,
      title: item.destination || item.travelKindLabel || "Voyage personnalisé",
      departureDate: item.departureDate,
      travelers: item.travelers,
      amount,
      paidAmount: 0,
      status: item.status,
      statusLabel: customTripStatusLabel[item.status] ?? item.status,
      createdAt: item.createdAt,
    };
    client.trips.push(trip);
    client.bookingCount += 1;
    client.travelersTotal += item.travelers;
    client.amountEngaged += item.status === "closed" ? 0 : amount;
    touch(client, item.updatedAt || item.createdAt);
  }

  return [...map.values()]
    .map((client) => {
      const trips = client.trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const current = pickCurrentTrip(trips);
      return {
        ...client,
        trips,
        currentTripTitle: current?.title ?? "",
        currentTripDate: current?.departureDate ?? "",
      };
    })
    .sort((a, b) => (b.lastActivityAt || "").localeCompare(a.lastActivityAt || ""));
}

export function pickCurrentTrip(trips: ClientTripRecord[]) {
  const today = new Date().toISOString().slice(0, 10);
  const open = trips.filter(
    (item) => item.status !== "cancelled" && item.status !== "closed"
  );
  const pool = open.length > 0 ? open : trips;
  if (pool.length === 0) return undefined;
  const upcoming = [...pool]
    .filter((item) => item.departureDate && item.departureDate >= today)
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
  if (upcoming[0]) return upcoming[0];
  return [...pool].sort((a, b) =>
    (b.departureDate || b.createdAt).localeCompare(a.departureDate || a.createdAt)
  )[0];
}

export function groupBookingsByTrip(
  reservations: Reservation[],
  options?: { includeCancelled?: boolean }
) {
  const groups = new Map<
    string,
    {
      id: string;
      destinationId: string;
      title: string;
      country: string;
      departureDate: string;
      travelers: number;
      amountPaid: number;
      bookings: Reservation[];
    }
  >();

  for (const item of reservations) {
    if (!options?.includeCancelled && item.status === "cancelled") continue;
    const id = `${item.destinationId}|${item.departureDate}`;
    const existing = groups.get(id);
    if (existing) {
      existing.travelers += item.travelers;
      existing.amountPaid += isPaidReservation(item.status) ? item.totalPrice : 0;
      existing.bookings.push(item);
      continue;
    }
    groups.set(id, {
      id,
      destinationId: item.destinationId,
      title: item.destinationTitle,
      country: item.country,
      departureDate: item.departureDate,
      travelers: item.travelers,
      amountPaid: isPaidReservation(item.status) ? item.totalPrice : 0,
      bookings: [item],
    });
  }

  return [...groups.values()].sort((a, b) =>
    a.departureDate.localeCompare(b.departureDate)
  );
}

export function groupConfirmedTrips(reservations: Reservation[]) {
  return groupBookingsByTrip(
    reservations.filter((item) => item.status === "confirmed")
  );
}
