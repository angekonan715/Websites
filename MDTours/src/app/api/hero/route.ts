import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveProcessedImage, saveProcessedVideo } from "@/lib/media";
import { getHeroSettings, saveHeroSettings } from "@/lib/store";

function isImageFile(value: FormDataEntryValue | null): value is File {
  return (
    value instanceof File &&
    value.size > 0 &&
    ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(value.type)
  );
}

function isVideoFile(value: FormDataEntryValue | null): value is File {
  return (
    value instanceof File &&
    value.size > 0 &&
    ["video/mp4", "video/webm", "video/quicktime"].includes(value.type)
  );
}

export async function GET() {
  return NextResponse.json({ hero: await getHeroSettings() });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const current = await getHeroSettings();
    const stamp = Date.now();
    let image = current.image;
    let video = current.video;

    const uploadedImage = formData.get("image");
    const sourceImage = String(formData.get("sourceImage") ?? "").trim();
    if (isImageFile(uploadedImage)) {
      image = await saveProcessedImage(uploadedImage, "background", `hero-${stamp}`, "hero");
    } else if (sourceImage.startsWith("/")) {
      image = await saveProcessedImage(sourceImage, "background", `hero-${stamp}`, "hero");
    }

    if (String(formData.get("clearVideo") ?? "") === "1") {
      video = "";
    } else {
      const uploadedVideo = formData.get("video");
      const sourceVideo = String(formData.get("sourceVideo") ?? "").trim();
      if (isVideoFile(uploadedVideo)) {
        video = await saveProcessedVideo(uploadedVideo, `hero-${stamp}`);
      } else if (sourceVideo.startsWith("/")) {
        video = await saveProcessedVideo(sourceVideo, `hero-${stamp}`);
      }
    }

    const hero = {
      image,
      video,
      alt: String(formData.get("alt") ?? "").trim() || "Voyage MD Tours",
      sourceLabel: String(formData.get("sourceLabel") ?? "").trim(),
      updatedAt: new Date().toISOString(),
    };
    await saveHeroSettings(hero);
    return NextResponse.json({ hero });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d’enregistrer le fond de la page d’accueil.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
