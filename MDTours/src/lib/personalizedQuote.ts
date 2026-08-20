import type {
  AccommodationType,
  PersonalizedCatalog,
  PersonalizedQuote,
  VehicleType,
} from "./types";

export interface QuoteInput {
  adults: number;
  childrenUnder12: number;
  childrenUnder16: number;
  departureDate: string;
  returnDate: string;
  accommodation: AccommodationType | "";
  vehicle: VehicleType | "";
  activityIds: string[];
}

export const accommodationLabels: Record<AccommodationType, string> = {
  hotel: "Hôtel",
  residence: "Résidence meublée",
};

export const vehicleLabels: Record<VehicleType, string> = {
  standard: "Standard",
  medium: "Moyen",
  premium: "Premium",
};

export function nightsBetween(departureDate: string, returnDate: string) {
  if (!departureDate || !returnDate) return 0;
  const start = new Date(`${departureDate}T00:00:00`);
  const end = new Date(`${returnDate}T00:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Number.isFinite(nights) ? Math.max(0, nights) : 0;
}

export function travelerCount(input: Pick<QuoteInput, "adults" | "childrenUnder12" | "childrenUnder16">) {
  return Math.max(0, input.adults) + Math.max(0, input.childrenUnder12) + Math.max(0, input.childrenUnder16);
}

export function activityPrice(
  activity: { adult: number; childUnder12: number; childUnder16: number },
  input: Pick<QuoteInput, "adults" | "childrenUnder12" | "childrenUnder16">
) {
  return (
    input.adults * activity.adult +
    input.childrenUnder12 * activity.childUnder12 +
    input.childrenUnder16 * activity.childUnder16
  );
}

export function buildPersonalizedQuote(
  catalog: PersonalizedCatalog,
  input: QuoteInput
): PersonalizedQuote {
  const adults = Math.max(0, input.adults);
  const childrenUnder12 = Math.max(0, input.childrenUnder12);
  const childrenUnder16 = Math.max(0, input.childrenUnder16);
  const travelers = adults + childrenUnder12 + childrenUnder16;
  const nights = nightsBetween(input.departureDate, input.returnDate);
  const vehicleDays = nights > 0 ? nights : input.departureDate ? 1 : 0;
  const breakdown: PersonalizedQuote["breakdown"] = [];

  let accommodationTotal = 0;
  const lodging = catalog.accommodations.find((item) => item.id === input.accommodation);
  if (lodging && nights > 0 && travelers > 0) {
    if (lodging.id === "hotel") {
      accommodationTotal =
        nights *
        (adults * (lodging.adultPerNight ?? 0) +
          childrenUnder12 * (lodging.childUnder12PerNight ?? 0) +
          childrenUnder16 * (lodging.childUnder16PerNight ?? 0));
      breakdown.push({
        label: `Hôtel · ${nights} nuit${nights > 1 ? "s" : ""}`,
        amount: accommodationTotal,
      });
    } else {
      const extraPeople = Math.max(0, travelers - (lodging.includedPeople ?? 0));
      accommodationTotal =
        nights *
        ((lodging.nightlyRate ?? 0) + extraPeople * (lodging.extraPersonPerNight ?? 0));
      breakdown.push({
        label: `Résidence meublée · ${nights} nuit${nights > 1 ? "s" : ""}`,
        amount: accommodationTotal,
      });
    }
  }

  let vehicleTotal = 0;
  const car = catalog.vehicles.find((item) => item.id === input.vehicle);
  if (car && vehicleDays > 0) {
    vehicleTotal = vehicleDays * car.pricePerDay;
    breakdown.push({
      label: `Véhicule ${car.label.toLowerCase()} · ${vehicleDays} jour${vehicleDays > 1 ? "s" : ""}`,
      amount: vehicleTotal,
    });
  }

  let activitiesTotal = 0;
  const selected = new Set(input.activityIds);
  for (const city of catalog.cities) {
    for (const activity of city.activities) {
      if (!selected.has(activity.id)) continue;
      const amount = activityPrice(activity, { adults, childrenUnder12, childrenUnder16 });
      activitiesTotal += amount;
      breakdown.push({
        label: `${activity.name} (${city.name})`,
        amount,
      });
    }
  }

  return {
    nights,
    vehicleDays,
    travelers,
    accommodation: accommodationTotal,
    vehicle: vehicleTotal,
    activities: activitiesTotal,
    total: accommodationTotal + vehicleTotal + activitiesTotal,
    breakdown,
  };
}
