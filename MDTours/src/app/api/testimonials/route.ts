import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getInvites,
  getTestimonials,
  saveInvites,
  saveTestimonials,
} from "@/lib/store";
import type { Testimonial } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  const testimonials = await getTestimonials();
  if (user?.role === "admin") {
    return NextResponse.json({ testimonials });
  }
  return NextResponse.json({
    testimonials: testimonials.filter((item) => item.status === "approved"),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour témoigner." }, { status: 401 });
  }

  const body = (await request.json()) as {
    token?: string;
    tripTitle?: string;
    rating?: number;
    message?: string;
  };
  const token = body.token?.trim() ?? "";
  const tripTitle = body.tripTitle?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const rating = Number(body.rating ?? 0);

  if (!token || !tripTitle || message.length < 20 || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Lien d’invitation, voyage, note et témoignage (20 caractères min.) sont requis." },
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
    return NextResponse.json({ error: "Ce lien a expiré. Demandez-en un nouveau à MD Tours." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const testimonial: Testimonial = {
    id: crypto.randomUUID(),
    userId: user.id,
    authorName: user.name,
    tripTitle,
    rating,
    message,
    status: "pending",
    inviteToken: token,
    createdAt: now,
  };

  invite.usedAt = now;
  invite.usedBy = user.id;
  const testimonials = await getTestimonials();
  testimonials.push(testimonial);
  await saveTestimonials(testimonials);
  await saveInvites(invites);

  return NextResponse.json({ testimonial }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: "approved" | "rejected";
  };
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
