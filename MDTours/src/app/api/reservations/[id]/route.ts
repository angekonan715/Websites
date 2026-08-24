import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTripConfirmationEmail } from "@/lib/email";
import { getDestinations, getReservations, saveReservations } from "@/lib/store";
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

  const occupying =
    body.status === "payment_received" || body.status === "confirmed";
  const alreadyOccupying =
    reservation.status === "payment_received" ||
    reservation.status === "confirmed";
  if (occupying && !alreadyOccupying) {
    const destinations = await getDestinations();
    const destination = destinations.find(
      (item) => item.id === reservation.destinationId
    );
    const remaining = destination?.availablePlaces ?? 0;
    if (reservation.travelers > remaining) {
      return NextResponse.json(
        {
          error:
            remaining <= 0
              ? "Plus aucune place disponible. Augmentez la capacité de ce voyage, ou annulez une autre réservation confirmée."
              : `Il ne reste que ${remaining} place${remaining > 1 ? "s" : ""} : cette réservation en demande ${reservation.travelers}. Augmentez la capacité avant de confirmer.`,
        },
        { status: 400 }
      );
    }
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
      const destinations = await getDestinations();
      const destination = destinations.find(
        (item) => item.id === reservation.destinationId
      );
      await sendTripConfirmationEmail(reservation, destination);
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
