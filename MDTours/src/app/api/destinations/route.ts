import { NextResponse } from "next/server";
import { DEFAULT_CAPACITY } from "@/lib/availability";
import { getCurrentUser } from "@/lib/auth";
import {
  getDestinations,
  saveDestinations,
  savePublicFile,
  slugify,
} from "@/lib/store";
import type { Destination } from "@/lib/types";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const videoTypes = ["video/mp4", "video/webm"];

function readTripFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim().toUpperCase(),
    duration: String(formData.get("duration") ?? "").trim(),
    price: Number(formData.get("price")),
    rating: Number(formData.get("rating") || 4.8),
    reviews: Number(formData.get("reviews") || 0),
    description: String(formData.get("description") ?? "").trim(),
    capacity: Number(formData.get("capacity") || DEFAULT_CAPACITY),
  };
}

function isImageFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && imageTypes.includes(value.type);
}

function isVideoFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0 && videoTypes.includes(value.type);
}

export async function GET() {
  const destinations = await getDestinations();
  return NextResponse.json({ destinations });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const fields = readTripFields(formData);
    const imageFile = formData.get("image");
    const videoFile = formData.get("video");
    const galleryFiles = formData.getAll("gallery");

    if (!fields.title || !fields.country || !fields.duration || !Number.isFinite(fields.price) || fields.price <= 0) {
      return NextResponse.json(
        { error: "Titre, pays, durée et prix sont requis." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(fields.capacity) || fields.capacity < 1 || fields.capacity > 500) {
      return NextResponse.json(
        { error: "Le nombre de places doit être compris entre 1 et 500." },
        { status: 400 }
      );
    }
    if (!isImageFile(imageFile)) {
      return NextResponse.json(
        { error: "Ajoutez une photo de couverture (JPG, PNG ou WEBP)." },
        { status: 400 }
      );
    }

    const destinations = await getDestinations();
    let id = slugify(fields.title) || `voyage-${Date.now()}`;
    if (destinations.some((item) => item.id === id)) {
      id = `${id}-${Date.now()}`;
    }

    const image = await savePublicFile(imageFile, "images", id);
    const gallery: string[] = [];
    for (const [index, file] of galleryFiles.entries()) {
      if (isImageFile(file)) {
        gallery.push(await savePublicFile(file, "images", `${id}-gallery-${index}-${Date.now()}`));
      }
    }

    const destination: Destination = {
      id,
      title: fields.title,
      country: fields.country,
      duration: fields.duration,
      price: fields.price,
      rating: Math.min(5, Math.max(0, fields.rating)),
      reviews: Math.max(0, fields.reviews),
      description: fields.description,
      capacity: Math.floor(fields.capacity),
      image,
      gallery,
      video: isVideoFile(videoFile)
        ? await savePublicFile(videoFile, "video", id)
        : "",
    };

    destinations.push(destination);
    await saveDestinations(destinations);
    return NextResponse.json({ destination }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'ajouter ce voyage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "").trim();
    const destinations = await getDestinations();
    const destination = destinations.find((item) => item.id === id);
    if (!destination) {
      return NextResponse.json({ error: "Voyage introuvable." }, { status: 404 });
    }

    const fields = readTripFields(formData);
    if (!fields.title || !fields.country || !fields.duration || !Number.isFinite(fields.price) || fields.price <= 0) {
      return NextResponse.json(
        { error: "Titre, pays, durée et prix sont requis." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(fields.capacity) || fields.capacity < 1 || fields.capacity > 500) {
      return NextResponse.json(
        { error: "Le nombre de places doit être compris entre 1 et 500." },
        { status: 400 }
      );
    }
    if (fields.capacity < (destination.bookedPlaces ?? 0)) {
      return NextResponse.json(
        {
          error: `Impossible de descendre sous ${destination.bookedPlaces} places : des réservations sont déjà confirmées. Annulez-en une, ou augmentez la capacité.`,
        },
        { status: 400 }
      );
    }

    destination.title = fields.title;
    destination.country = fields.country;
    destination.duration = fields.duration;
    destination.price = fields.price;
    destination.rating = Math.min(5, Math.max(0, fields.rating));
    destination.reviews = Math.max(0, fields.reviews);
    destination.description = fields.description;
    destination.capacity = Math.floor(fields.capacity);

    const imageFile = formData.get("image");
    if (isImageFile(imageFile)) {
      destination.image = await savePublicFile(imageFile, "images", `${id}-${Date.now()}`);
    }

    const videoFile = formData.get("video");
    if (isVideoFile(videoFile)) {
      destination.video = await savePublicFile(videoFile, "video", `${id}-${Date.now()}`);
    }
    if (String(formData.get("removeVideo") ?? "") === "1") {
      destination.video = "";
    }

    const galleryFiles = formData.getAll("gallery");
    const gallery = destination.gallery ?? [];
    for (const [index, file] of galleryFiles.entries()) {
      if (isImageFile(file)) {
        gallery.push(
          await savePublicFile(file, "images", `${id}-gallery-${Date.now()}-${index}`)
        );
      }
    }
    destination.gallery = gallery;

    await saveDestinations(destinations);
    return NextResponse.json({ destination });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de modifier ce voyage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const destinations = await getDestinations();
  const next = destinations.filter((item) => item.id !== id);
  if (next.length === destinations.length) {
    return NextResponse.json({ error: "Voyage introuvable." }, { status: 404 });
  }

  await saveDestinations(next);
  return NextResponse.json({ ok: true });
}
