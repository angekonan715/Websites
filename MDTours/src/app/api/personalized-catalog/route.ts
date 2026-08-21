import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPersonalizedCatalog, savePersonalizedCatalog, slugify } from "@/lib/store";
import type { PersonalizedCatalog, PersonalizedCity } from "@/lib/types";

export async function GET() {
  const catalog = await getPersonalizedCatalog();
  return NextResponse.json({ catalog });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<PersonalizedCatalog> & {
      cityName?: string;
      activity?: {
        id?: string;
        cityId?: string;
        name?: string;
        description?: string;
        adult?: number;
        childUnder12?: number;
        childUnder16?: number;
      };
      updateCity?: { id?: string; name?: string };
      deleteActivityId?: string;
      deleteCityId?: string;
    };

    const catalog = await getPersonalizedCatalog();

    if (body.accommodations) catalog.accommodations = body.accommodations;
    if (body.vehicles) catalog.vehicles = body.vehicles;
    if (body.note !== undefined) catalog.note = body.note;

    if (body.cityName?.trim()) {
      const name = body.cityName.trim();
      const id = slugify(name);
      if (!catalog.cities.some((city) => city.id === id)) {
        catalog.cities.push({ id, name, activities: [] });
      }
    }

    if (body.deleteActivityId) {
      for (const city of catalog.cities) {
        city.activities = city.activities.filter(
          (activity) => activity.id !== body.deleteActivityId
        );
      }
    }

    if (body.deleteCityId) {
      catalog.cities = catalog.cities.filter((city) => city.id !== body.deleteCityId);
    }

    if (body.updateCity?.id && body.updateCity.name?.trim()) {
      const city = catalog.cities.find((item) => item.id === body.updateCity?.id);
      if (city) city.name = body.updateCity.name.trim();
    }

    const activity = body.activity;
    if (activity?.id && activity.name?.trim()) {
      let found = false;
      for (const city of catalog.cities) {
        const current = city.activities.find((item) => item.id === activity.id);
        if (!current) continue;
        current.name = activity.name.trim();
        current.description = activity.description?.trim() ?? current.description;
        current.adult = Number(activity.adult ?? current.adult);
        current.childUnder12 = Number(activity.childUnder12 ?? current.childUnder12);
        current.childUnder16 = Number(activity.childUnder16 ?? current.childUnder16);
        found = true;
        break;
      }
      if (!found) {
        return NextResponse.json({ error: "Activité introuvable." }, { status: 404 });
      }
    } else if (activity?.name?.trim() && activity.cityId) {
      let city: PersonalizedCity | undefined = catalog.cities.find(
        (item) => item.id === activity.cityId
      );
      if (!city) {
        return NextResponse.json({ error: "Ville introuvable." }, { status: 400 });
      }
      city.activities.push({
        id: `${city.id}-${slugify(activity.name)}-${Date.now()}`,
        name: activity.name.trim(),
        description: activity.description?.trim() ?? "",
        adult: Number(activity.adult ?? 0),
        childUnder12: Number(activity.childUnder12 ?? 0),
        childUnder16: Number(activity.childUnder16 ?? 0),
      });
    }

    await savePersonalizedCatalog(catalog);
    return NextResponse.json({ catalog });
  } catch {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
