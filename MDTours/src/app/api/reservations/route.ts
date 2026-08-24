import { after, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendTripInquiryEmail } from "@/lib/email";
import { tripUnitPrice } from "@/lib/pricing";
import {
  createBookingReference,
  getDestinations,
  getReservations,
  saveReservations,
} from "@/lib/store";
import type { Reservation } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const reservations = await getReservations();
  const visible =
    user.role === "admin"
      ? reservations
      : reservations.filter((item) => item.userId === user.id);

  return NextResponse.json({
    reservations: visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour réserver." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      destinationId?: string;
      phone?: string;
      departureDate?: string;
      travelers?: number;
      notes?: string;
      name?: string;
    };

    const destinationId = body.destinationId?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const departureDate = body.departureDate?.trim() ?? "";
    const travelers = Number(body.travelers ?? 1);
    const notes = body.notes?.trim() ?? "";
    const name = body.name?.trim() || user.name;

    if (!destinationId || !phone) {
      return NextResponse.json(
        { error: "Le téléphone est requis." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(travelers) || travelers < 1 || travelers > 20) {
      return NextResponse.json(
        { error: "Nombre de voyageurs invalide." },
        { status: 400 }
      );
    }

    const destinations = await getDestinations();
    const destination = destinations.find((item) => item.id === destinationId);
    if (!destination) {
      return NextResponse.json({ error: "Voyage introuvable." }, { status: 404 });
    }

    const remaining = destination.availablePlaces ?? 0;
    if (remaining <= 0) {
      return NextResponse.json(
        { error: "Ce voyage est complet. Plus aucune place n’est disponible." },
        { status: 400 }
      );
    }
    if (travelers > remaining) {
      return NextResponse.json(
        {
          error:
            remaining === 1
              ? "Il ne reste qu’1 place disponible pour ce voyage."
              : `Il ne reste que ${remaining} places disponibles pour ce voyage.`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      reference: createBookingReference(),
      userId: user.id,
      destinationId: destination.id,
      destinationTitle: destination.title,
      country: destination.country,
      duration: destination.duration,
      image: destination.image,
      name,
      email: user.email,
      phone,
      departureDate,
      travelers,
      unitPrice: tripUnitPrice(destination),
      totalPrice: tripUnitPrice(destination) * travelers,
      notes,
      status: "awaiting_contact",
      createdAt: now,
      updatedAt: now,
    };

    const reservations = await getReservations();
    reservations.push(reservation);
    await saveReservations(reservations);

    after(async () => {
      try {
        await sendTripInquiryEmail(reservation, destination);
      } catch (error) {
        console.error("Reservation email failed:", error);
      }
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer la réservation." },
      { status: 500 }
    );
  }
}
