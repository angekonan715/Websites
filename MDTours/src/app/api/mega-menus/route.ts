import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMegaMenus, getStoredMegaMenus, saveMegaMenus } from "@/lib/store";
import { saveProcessedImage } from "@/lib/media";
import { placePath, regionPath, slugify } from "@/lib/megaMenus";
import type { MegaMenuKey, MegaMenuRegion, MegaMenus } from "@/lib/types";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

function isImageFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && imageTypes.includes(value.type);
}

function sanitizeRegions(value: unknown, key: MegaMenuKey): MegaMenuRegion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const region = item as Partial<MegaMenuRegion>;
      const id = String(region.id ?? crypto.randomUUID());
      const destinations = Array.isArray(region.destinations)
        ? region.destinations
            .map((link) => {
              const placeId =
                String(link?.id ?? "").trim() ||
                slugify(String(link?.label ?? "")) ||
                crypto.randomUUID();
              const href =
                key === "destinations"
                  ? placePath(id, placeId)
                  : String(link?.href ?? "").trim() || "/voyages";
              return {
                id: placeId,
                label: String(link?.label ?? "").trim(),
                href,
                image: String(link?.image ?? "").trim() || undefined,
                description: String(link?.description ?? "").trim() || undefined,
              };
            })
            .filter((link) => link.label)
        : [];
      return {
        id,
        label: String(region.label ?? "").trim(),
        href:
          key === "destinations"
            ? regionPath(id)
            : String(region.href ?? "").trim() || "/voyages",
        image: String(region.image ?? "").trim() || "/images/cape-coast.png",
        tagline: String(region.tagline ?? "").trim(),
        destinations,
      };
    })
    .filter((region) => region.label);
}

export async function GET() {
  const menus = await getMegaMenus();
  return NextResponse.json({ menus });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const key = String(formData.get("key") ?? "") as MegaMenuKey;
    if (key !== "destinations" && key !== "voyages") {
      return NextResponse.json({ error: "Menu invalide." }, { status: 400 });
    }

    const parsed = JSON.parse(String(formData.get("regions") ?? "[]")) as unknown;
    let regions = sanitizeRegions(parsed, key);
    if (regions.length === 0) {
      return NextResponse.json(
        { error: "Ajoutez au moins une région." },
        { status: 400 }
      );
    }

    for (const region of regions) {
      const file = formData.get(`image-${region.id}`);
      if (isImageFile(file)) {
        region.image = await saveProcessedImage(
          file,
          "images",
          `menu-${key}-${region.id}-${Date.now()}`,
          "wide"
        );
      }
      for (const place of region.destinations) {
        const placeFile = formData.get(`place-${region.id}-${place.id}`);
        if (isImageFile(placeFile)) {
          place.image = await saveProcessedImage(
            placeFile,
            "images",
            `lieu-${region.id}-${place.id}-${Date.now()}`,
            "wide"
          );
        }
      }
    }

    const stored = await getStoredMegaMenus();
    const next: MegaMenus = { ...stored, [key]: regions };
    await saveMegaMenus(next);
    return NextResponse.json({ menus: await getMegaMenus() });
  } catch {
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
