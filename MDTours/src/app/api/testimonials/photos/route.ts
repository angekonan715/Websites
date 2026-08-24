import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTestimonials, savePublicFile, saveTestimonials } from "@/lib/store";
import { isImageFile } from "@/lib/media";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    const files = formData.getAll("images");
    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    }

    const testimonials = await getTestimonials();
    const item = testimonials.find((entry) => entry.id === id);
    if (!item) {
      return NextResponse.json({ error: "Témoignage introuvable." }, { status: 404 });
    }

    const images = [...(item.images ?? [])];
    for (const [index, file] of files.entries()) {
      if (isImageFile(file)) {
        images.push(await savePublicFile(file, "images", `${id}-${Date.now()}-${index}`));
      }
    }
    item.images = images;
    await saveTestimonials(testimonials);
    return NextResponse.json({ testimonial: item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ajout impossible.";
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
  const image = searchParams.get("image");
  if (!id || !image) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  const testimonials = await getTestimonials();
  const item = testimonials.find((entry) => entry.id === id);
  if (!item) {
    return NextResponse.json({ error: "Témoignage introuvable." }, { status: 404 });
  }
  item.images = (item.images ?? []).filter((src) => src !== image);
  await saveTestimonials(testimonials);
  return NextResponse.json({ testimonial: item });
}
