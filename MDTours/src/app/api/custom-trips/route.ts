import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createBookingReference,
  getCustomTrips,
  getPersonalizedCatalog,
  saveCustomTrips,
} from "@/lib/store";
import { sendCustomTripQuoteEmail } from "@/lib/email";
import { buildPersonalizedQuote, travelerCount } from "@/lib/personalizedQuote";
import type {
  AccommodationType,
  CustomTripRequest,
  VehicleType,
} from "@/lib/types";

const accommodations: AccommodationType[] = ["hotel", "residence"];
const vehicles: VehicleType[] = ["standard", "medium", "premium"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const requests = await getCustomTrips();
  const visible =
    user.role === "admin"
      ? requests
      : requests.filter((item) => item.userId === user.id);

  return NextResponse.json({
    requests: visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Connectez-vous pour enregistrer votre voyage personnalisé." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      phone?: string;
      name?: string;
      departureDate?: string;
      returnDate?: string;
      adults?: number;
      childrenUnder12?: number;
      childrenUnder16?: number;
      accommodation?: string;
      vehicle?: string;
      cities?: string[];
      activityIds?: string[];
      suggestion?: string;
    };

    const phone = body.phone?.trim() ?? "";
    const departureDate = body.departureDate?.trim() ?? "";
    const returnDate = body.returnDate?.trim() ?? "";
    const adults = Number(body.adults ?? 0);
    const childrenUnder12 = Number(body.childrenUnder12 ?? 0);
    const childrenUnder16 = Number(body.childrenUnder16 ?? 0);
    const accommodation = accommodations.includes(body.accommodation as AccommodationType)
      ? (body.accommodation as AccommodationType)
      : null;
    const vehicle = vehicles.includes(body.vehicle as VehicleType)
      ? (body.vehicle as VehicleType)
      : null;
    const cities = Array.isArray(body.cities)
      ? body.cities.map((item) => String(item))
      : [];
    const activityIds = Array.isArray(body.activityIds)
      ? body.activityIds.map((item) => String(item))
      : [];
    const suggestion = body.suggestion?.trim() ?? "";
    const travelers = travelerCount({ adults, childrenUnder12, childrenUnder16 });

    if (!phone || !departureDate || !returnDate || !accommodation || !vehicle) {
      return NextResponse.json(
        {
          error:
            "Indiquez le téléphone, les dates, l’hébergement et le type de véhicule.",
        },
        { status: 400 }
      );
    }
    if (!Number.isFinite(travelers) || travelers < 1 || travelers > 20) {
      return NextResponse.json(
        { error: "Indiquez au moins un voyageur (maximum 20)." },
        { status: 400 }
      );
    }
    if (new Date(returnDate) < new Date(departureDate)) {
      return NextResponse.json(
        { error: "La date de retour doit être après la date de départ." },
        { status: 400 }
      );
    }
    if (cities.length === 0) {
      return NextResponse.json(
        { error: "Choisissez au moins une ville." },
        { status: 400 }
      );
    }

    const catalog = await getPersonalizedCatalog();
    const quote = buildPersonalizedQuote(catalog, {
      adults,
      childrenUnder12,
      childrenUnder16,
      departureDate,
      returnDate,
      accommodation,
      vehicle,
      activityIds,
    });

    const cityNames = catalog.cities
      .filter((city) => cities.includes(city.id))
      .map((city) => city.name);

    const now = new Date().toISOString();
    const customTrip: CustomTripRequest = {
      id: crypto.randomUUID(),
      reference: `P-${createBookingReference()}`,
      userId: user.id,
      name: body.name?.trim() || user.name,
      email: user.email,
      phone,
      travelKind: "personnalise",
      travelKindLabel: "Voyage personnalisé",
      destination: cityNames.join(", "),
      departureDate,
      returnDate,
      travelers,
      adults,
      childrenUnder12,
      childrenUnder16,
      accommodation,
      vehicle,
      cities,
      activityIds,
      nights: quote.nights,
      quote,
      budget: String(quote.total),
      suggestion,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await sendCustomTripQuoteEmail(customTrip);
      customTrip.quoteEmailSentAt = now;
    } catch {
      // SMTP is optional; the live quote is still saved.
    }

    const requests = await getCustomTrips();
    requests.push(customTrip);
    await saveCustomTrips(requests);

    return NextResponse.json({ request: customTrip }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer le voyage." },
      { status: 500 }
    );
  }
}
