import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAboutPage, saveAboutPage, savePublicFile } from "@/lib/store";
import { isImageFile } from "@/lib/media";
import type { AboutBlock, AboutPage } from "@/lib/types";

export async function GET() {
  const page = await getAboutPage();
  return NextResponse.json({ page });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const kicker = String(formData.get("kicker") ?? "").trim() || "À propos";
    const title = String(formData.get("title") ?? "").trim();
    const subtitle = String(formData.get("subtitle") ?? "").trim();
    const rawBlocks = String(formData.get("blocks") ?? "[]");

    if (!title) {
      return NextResponse.json({ error: "Le titre de l’article est requis." }, { status: 400 });
    }

    let parsed: AboutBlock[] = [];
    try {
      parsed = JSON.parse(rawBlocks) as AboutBlock[];
    } catch {
      return NextResponse.json({ error: "Article invalide." }, { status: 400 });
    }

    const blocks: AboutBlock[] = [];
    for (const block of parsed) {
      if (!block?.id || !block.type) continue;
      const next: AboutBlock = {
        id: block.id,
        type: block.type,
        text: String(block.text ?? "").trim(),
        caption: String(block.caption ?? "").trim(),
        image: block.image,
      };
      const file = formData.get(`image-${block.id}`);
      if (isImageFile(file)) {
        next.image = await savePublicFile(
          file,
          "images",
          `about-${block.id}-${Date.now()}`
        );
      }
      if (next.type === "image" && !next.image) {
        return NextResponse.json(
          { error: "Chaque bloc photo doit avoir une image." },
          { status: 400 }
        );
      }
      if ((next.type === "heading" || next.type === "paragraph") && !next.text) {
        return NextResponse.json(
          { error: "Les titres et paragraphes ne peuvent pas être vides." },
          { status: 400 }
        );
      }
      blocks.push(next);
    }

    const page: AboutPage = {
      kicker,
      title,
      subtitle,
      blocks,
      updatedAt: new Date().toISOString(),
    };
    await saveAboutPage(page);
    return NextResponse.json({ page });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enregistrement impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
