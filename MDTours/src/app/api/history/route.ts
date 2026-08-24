import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getHistoryTrips,
  saveHistoryTrips,
  slugify,
} from "@/lib/store";
import { saveProcessedImage, saveProcessedVideo } from "@/lib/media";
import type { HistoryTrip } from "@/lib/types";

export async function GET() {
  const trips = await getHistoryTrips();
  return NextResponse.json({
    trips: trips.sort((a, b) => b.date.localeCompare(a.date)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const files = formData.getAll("images");
    const videoFile = formData.get("video");

    if (!title || !location || !date) {
      return NextResponse.json(
        { error: "Titre, lieu et date sont requis." },
        { status: 400 }
      );
    }
    if (String(formData.get("imageRights") ?? "") !== "1") {
      return NextResponse.json(
        {
          error:
            "Confirmez que MD Tours a le droit de publier ces photos (accord des personnes visibles).",
        },
        { status: 400 }
      );
    }

    const id = `${slugify(title) || "souvenir"}-${Date.now()}`;
    const images: string[] = [];
    for (const [index, file] of files.entries()) {
      if (file instanceof File && file.size > 0 && file.type.startsWith("image/")) {
        images.push(
          await saveProcessedImage(file, "images", `${id}-${index}`, "wide")
        );
      }
    }

    let video = "";
    if (videoFile instanceof File && videoFile.size > 0 && videoFile.type.startsWith("video/")) {
      video = await saveProcessedVideo(videoFile, id);
    }

    const trip: HistoryTrip = {
      id,
      title,
      location,
      date,
      description,
      images,
      video,
      imageRightsConfirmed: true,
      imageRightsConfirmedAt: new Date().toISOString(),
    };
    const trips = await getHistoryTrips();
    trips.push(trip);
    await saveHistoryTrips(trips);
    return NextResponse.json({ trip }, { status: 201 });
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
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }
  const trips = await getHistoryTrips();
  await saveHistoryTrips(trips.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
