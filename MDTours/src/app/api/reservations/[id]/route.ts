import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTripConfirmationEmail } from "@/lib/email";
import { getReservations, saveReservations } from "@/lib/store";
import type { ReservationStatus } from "@/lib/types";

const allowedStatuses: ReservationStatus[] = [
  "awaiting_contact",
  "payment_received",
  "confirmed",
  "cancelled",
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const reservations = await getReservations();
  const reservation = reservations.find((item) => item.id === id);

  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (user.role !== "admin" && reservation.userId !== user.id) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  return NextResponse.json({ reservation });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { status?: ReservationStatus };
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const reservations = await getReservations();
  const reservation = reservations.find((item) => item.id === id);
  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  if (body.status === "confirmed" && reservation.status !== "payment_received") {
    return NextResponse.json(
      { error: "Confirmez d'abord le paiement avant le rendez-vous." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  reservation.status = body.status;
  reservation.updatedAt = now;
  if (body.status === "payment_received") {
    reservation.paymentConfirmedAt = now;
  }
  if (body.status === "confirmed") {
    reservation.appointmentConfirmedAt = now;
  }

  await saveReservations(reservations);

  let emailSent = false;
  let emailError = "";
  if (body.status === "payment_received") {
    try {
      await sendTripConfirmationEmail(reservation);
      emailSent = true;
      reservation.confirmationEmailSentAt = new Date().toISOString();
      await saveReservations(reservations);
    } catch (error) {
      emailError =
        error instanceof Error
          ? error.message
          : "Le paiement est confirmé, mais l'email n'a pas pu être envoyé.";
    }
  }

  return NextResponse.json({ reservation, emailSent, emailError });
}
