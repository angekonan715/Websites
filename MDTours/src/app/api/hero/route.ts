import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isImageFile, isUploadedFile, isVideoFile, saveProcessedImage, saveProcessedVideo } from "@/lib/media";
import { getHeroSettings, saveHeroSettings } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    if (isUploadedFile(uploadedImage) && !isImageFile(uploadedImage)) {
      return NextResponse.json(
        { error: "Cette photo n’est pas lisible. Envoyez un JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }
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
      if (isUploadedFile(uploadedVideo) && !isVideoFile(uploadedVideo)) {
        return NextResponse.json(
          { error: "Cette vidéo n’est pas lisible. Envoyez un MP4 ou WEBM." },
          { status: 400 }
        );
      }
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
