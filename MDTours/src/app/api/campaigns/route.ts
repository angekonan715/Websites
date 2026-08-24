import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseCampaignExpiry } from "@/lib/campaigns";
import { getCampaigns, saveCampaigns } from "@/lib/store";
import type { Campaign } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  const campaigns = await getCampaigns();
  const visible =
    user?.role === "admin"
      ? campaigns
      : campaigns.filter((item) => item.active);
  return NextResponse.json({
    campaigns: visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as {
    message?: string;
    href?: string;
    active?: boolean;
    expiresAt?: string;
  };
  const message = body.message?.trim() ?? "";
  if (message.length < 4) {
    return NextResponse.json(
      { error: "Le message de campagne est trop court." },
      { status: 400 }
    );
  }

  const expiresAt = parseCampaignExpiry(body.expiresAt);
  if (!expiresAt) {
    return NextResponse.json(
      { error: "Indiquez une date de fin valide." },
      { status: 400 }
    );
  }
  if (Date.parse(expiresAt) <= Date.now()) {
    return NextResponse.json(
      { error: "La date de fin doit être dans le futur." },
      { status: 400 }
    );
  }

  const campaign: Campaign = {
    id: crypto.randomUUID(),
    message,
    href: body.href?.trim() || undefined,
    active: body.active !== false,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  const campaigns = await getCampaigns();
  campaigns.unshift(campaign);
  await saveCampaigns(campaigns);
  return NextResponse.json({ campaign }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    message?: string;
    href?: string;
    active?: boolean;
    expiresAt?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const campaigns = await getCampaigns();
  const campaign = campaigns.find((item) => item.id === body.id);
  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });
  }
  if (body.message !== undefined) {
    const message = body.message.trim();
    if (message.length < 4) {
      return NextResponse.json({ error: "Le message est trop court." }, { status: 400 });
    }
    campaign.message = message;
  }
  if (body.href !== undefined) campaign.href = body.href.trim() || undefined;
  if (body.active !== undefined) campaign.active = body.active;
  if (body.expiresAt !== undefined) {
    const expiresAt = parseCampaignExpiry(body.expiresAt);
    if (!expiresAt) {
      return NextResponse.json(
        { error: "Indiquez une date de fin valide." },
        { status: 400 }
      );
    }
    if (Date.parse(expiresAt) <= Date.now()) {
      return NextResponse.json(
        { error: "La date de fin doit être dans le futur." },
        { status: 400 }
      );
    }
    campaign.expiresAt = expiresAt;
  }
  await saveCampaigns(campaigns);
  return NextResponse.json({ campaign });
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
  const campaigns = await getCampaigns();
  await saveCampaigns(campaigns.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
