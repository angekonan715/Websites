import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildClientRecords, groupConfirmedTrips, isPaidReservation } from "@/lib/records";
import {
  getClientNotes,
  getCustomTrips,
  getReservations,
  getUsers,
  upsertClientNote,
} from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const [reservations, customTrips, users, notes] = await Promise.all([
    getReservations(),
    getCustomTrips(),
    getUsers(),
    getClientNotes(),
  ]);

  const clients = buildClientRecords(reservations, customTrips, users, notes);
  const confirmedTrips = groupConfirmedTrips(reservations);
  const paid = reservations.filter((item) => isPaidReservation(item.status));

  return NextResponse.json({
    clients,
    reservations: reservations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    confirmedTrips,
    stats: {
      bookings: reservations.length,
      awaiting: reservations.filter((item) => item.status === "awaiting_contact").length,
      paid: paid.length,
      confirmed: reservations.filter((item) => item.status === "confirmed").length,
      cancelled: reservations.filter((item) => item.status === "cancelled").length,
      clients: clients.length,
      revenuePaid: paid.reduce((sum, item) => sum + item.totalPrice, 0),
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as { clientId?: string; notes?: string };
  const clientId = body.clientId?.trim() ?? "";
  if (!clientId) {
    return NextResponse.json({ error: "Client introuvable." }, { status: 400 });
  }

  const text = body.notes?.trim() ?? "";
  await upsertClientNote({
    id: clientId,
    notes: text,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}