import { after, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured, sendReservationStatusEmail } from "@/lib/email";
import { isOwnBooking } from "@/lib/records";
import { isInTrash } from "@/lib/reservationTrash";
import {
  getDestinations,
  getReservationById,
  restoreReservation,
  softDeleteReservation,
  updateReservation,
} from "@/lib/store";
import type { ReservationStatus } from "@/lib/types";

const allowedStatuses: ReservationStatus[] = ["payment_received", "cancelled"];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const reservation = await getReservationById(id, {
    includeDeleted: user.role === "admin",
  });

  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (user.role !== "admin" && !isOwnBooking(user, reservation)) {
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
  const body = (await request.json()) as { status?: ReservationStatus; restore?: boolean };
  if (body.restore) {
    const restored = await restoreReservation(id);
    if (!restored) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    return NextResponse.json({ reservation: restored });
  }

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json(
      {
        error:
          "Choisissez Paiement confirmé ou Annulée. Le rendez-vous confirmé n’est plus utilisé, et un dossier ne peut pas revenir en attente de contact.",
      },
      { status: 400 }
    );
  }

  const reservation = await getReservationById(id, { includeDeleted: true });
  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (isInTrash(reservation)) {
    return NextResponse.json(
      { error: "Cette réservation est dans la corbeille. Restaurez-la avant de la modifier." },
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

  const previousStatus = reservation.status;
  const now = new Date().toISOString();
  reservation.status = body.status;
  reservation.updatedAt = now;
  if (body.status === "payment_received") {
    reservation.paymentConfirmedAt = now;
  }
  if (body.status === "confirmed") {
    reservation.appointmentConfirmedAt = now;
  }

  await updateReservation(reservation);

  const statusChanged = previousStatus !== body.status;
  if (statusChanged) {
    after(async () => {
      try {
        const destinations = await getDestinations();
        const destination = destinations.find(
          (item) => item.id === reservation.destinationId
        );
        await sendReservationStatusEmail(reservation, destination);
        if (body.status === "payment_received" || body.status === "confirmed") {
          reservation.confirmationEmailSentAt = new Date().toISOString();
          await updateReservation(reservation);
        }
      } catch (error) {
        console.error("Reservation status email failed:", error);
      }
    });
  }

  return NextResponse.json({
    reservation,
    emailQueued: statusChanged && isEmailConfigured(),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { id } = await context.params;
  const reservation = await getReservationById(id, { includeDeleted: true });
  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (isInTrash(reservation)) {
    return NextResponse.json({ reservation });
  }

  const deleted = await softDeleteReservation(id);
  return NextResponse.json({ reservation: deleted });
}
