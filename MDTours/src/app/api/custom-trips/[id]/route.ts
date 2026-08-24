import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isOwnBooking } from "@/lib/records";
import { getCustomTripById, updateCustomTrip } from "@/lib/store";
import type { CustomTripStatus } from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const item = await getCustomTripById(id);
  if (!item) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }
  if (user.role !== "admin" && !isOwnBooking(user, item)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  return NextResponse.json({ request: item });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: CustomTripStatus;
    proposalTitle?: string;
    proposalDetails?: string;
    proposedPrice?: number;
    proposedDuration?: string;
  };
  const item = await getCustomTripById(id);
  if (!item) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  const details = body.proposalDetails?.trim() ?? "";
  if (body.status === "proposal_sent" && details.length < 20) {
    return NextResponse.json(
      { error: "Écrivez les détails du voyage (20 caractères min.) pour le client." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  if (body.status) item.status = body.status;
  if (body.proposalTitle !== undefined) item.proposalTitle = body.proposalTitle.trim();
  if (body.proposalDetails !== undefined) item.proposalDetails = details;
  if (body.proposedDuration !== undefined) {
    item.proposedDuration = body.proposedDuration.trim();
  }
  if (body.proposedPrice !== undefined && Number.isFinite(body.proposedPrice)) {
    item.proposedPrice = body.proposedPrice;
  }
  item.updatedAt = now;

  await updateCustomTrip(item);
  return NextResponse.json({ request: item });
}
