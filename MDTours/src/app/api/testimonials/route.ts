import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getInvites,
  getTestimonials,
  saveInvites,
  savePublicFile,
  saveTestimonials,
} from "@/lib/store";
import { isImageFile } from "@/lib/media";
import type { Testimonial } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  const testimonials = await getTestimonials();
  if (user?.role === "admin") {
    return NextResponse.json({ testimonials });
  }
  return NextResponse.json({
    testimonials: testimonials.filter(
      (item) =>
        item.status === "approved" &&
        item.userId !== "admin" &&
        item.authorName !== "Administrateur"
    ),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour témoigner." }, { status: 401 });
  }

  try {
    if (user.role === "admin") {
      return NextResponse.json(
        {
          error:
            "Connectez-vous avec un compte client pour publier un témoignage. Le compte administrateur n’apparaît pas sur l’historique.",
        },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let token = "";
    let tripTitle = "";
    let message = "";
    let rating = 0;
    let imageRightsAccepted = false;
    const files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      token = String(formData.get("token") ?? "").trim();
      tripTitle = String(formData.get("tripTitle") ?? "").trim();
      message = String(formData.get("message") ?? "").trim();
      rating = Number(formData.get("rating") ?? 0);
      imageRightsAccepted =
        String(formData.get("imageRights") ?? "") === "1";
      for (const entry of formData.getAll("images")) {
        if (isImageFile(entry)) files.push(entry);
      }
    } else {
      const body = (await request.json()) as {
        token?: string;
        tripTitle?: string;
        rating?: number;
        message?: string;
        imageRights?: boolean | string;
      };
      token = body.token?.trim() ?? "";
      tripTitle = body.tripTitle?.trim() ?? "";
      message = body.message?.trim() ?? "";
      rating = Number(body.rating ?? 0);
      imageRightsAccepted =
        body.imageRights === true || body.imageRights === "1";
    }

    if (!token || !tripTitle || message.length < 20 || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          error:
            "Lien d’invitation, voyage, note et témoignage (20 caractères min.) sont requis.",
        },
        { status: 400 }
      );
    }
    if (files.length > 8) {
      return NextResponse.json(
        { error: "Vous pouvez joindre jusqu’à 8 photos." },
        { status: 400 }
      );
    }
    if (!imageRightsAccepted) {
      return NextResponse.json(
        {
          error:
            "Cochez l’autorisation de publication pour envoyer votre témoignage et vos photos.",
        },
        { status: 400 }
      );
    }

    const invites = await getInvites();
    const invite = invites.find((item) => item.token === token);
    if (!invite) {
      return NextResponse.json({ error: "Lien d’invitation invalide." }, { status: 400 });
    }
    if (invite.usedAt) {
      return NextResponse.json({ error: "Ce lien a déjà été utilisé." }, { status: 400 });
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Ce lien a expiré. Demandez-en un nouveau à MD Tours." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const images: string[] = [];
    for (const [index, file] of files.entries()) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Seules les photos (JPG, PNG, WEBP) sont acceptées." },
          { status: 400 }
        );
      }
      images.push(await savePublicFile(file, "images", `${id}-${index}`));
    }

    const now = new Date().toISOString();
    const testimonial: Testimonial = {
      id,
      userId: user.id,
      authorName: user.name,
      tripTitle,
      rating,
      message,
      status: "approved",
      inviteToken: token,
      createdAt: now,
      images,
      imageRightsAccepted: true,
      imageRightsAcceptedAt: now,
    };

    invite.usedAt = now;
    invite.usedBy = user.id;
    const testimonials = await getTestimonials();
    testimonials.push(testimonial);
    await saveTestimonials(testimonials);
    await saveInvites(invites);

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'envoyer le témoignage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: "approved" | "rejected";
    message?: string;
    authorName?: string;
    rating?: number;
    tripTitle?: string;
  };
  if (body.message || body.authorName || body.rating || body.tripTitle) {
    return NextResponse.json(
      {
        error:
          "Le texte d’un témoignage client ne peut pas être modifié. Vous pouvez seulement le publier, le refuser, ou y joindre des photos.",
      },
      { status: 403 }
    );
  }
  if (!body.id || (body.status !== "approved" && body.status !== "rejected")) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const testimonials = await getTestimonials();
  const item = testimonials.find((entry) => entry.id === body.id);
  if (!item) {
    return NextResponse.json({ error: "Témoignage introuvable." }, { status: 404 });
  }
  item.status = body.status;
  await saveTestimonials(testimonials);
  return NextResponse.json({ testimonial: item });
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
  const testimonials = await getTestimonials();
  await saveTestimonials(testimonials.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
