import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  normalizeShareSlug,
  normalizeShareTarget,
  reservedShareSlugs,
} from "@/lib/shareLinks";
import { getShareLinks, saveShareLinks } from "@/lib/store";
import type { ShareLink, ShareLinkSource } from "@/lib/types";

const sources: ShareLinkSource[] = [
  "instagram",
  "tiktok",
  "facebook",
  "whatsapp",
  "other",
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }
  const links = await getShareLinks();
  return NextResponse.json({
    links: links.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as {
    title?: string;
    slug?: string;
    target?: string;
    source?: ShareLinkSource;
    showOnBio?: boolean;
  };

  const title = body.title?.trim() ?? "";
  const slug = normalizeShareSlug(body.slug || title);
  const target = normalizeShareTarget(body.target ?? "/");
  const source = sources.includes(body.source as ShareLinkSource)
    ? (body.source as ShareLinkSource)
    : "instagram";

  if (title.length < 2) {
    return NextResponse.json({ error: "Donnez un nom au lien." }, { status: 400 });
  }
  if (!slug || reservedShareSlugs.has(slug)) {
    return NextResponse.json({ error: "Ce nom de lien n’est pas disponible." }, { status: 400 });
  }

  const links = await getShareLinks();
  if (links.some((item) => item.slug === slug)) {
    return NextResponse.json({ error: "Ce lien court existe déjà." }, { status: 400 });
  }

  const link: ShareLink = {
    id: crypto.randomUUID(),
    slug,
    title,
    target,
    source,
    active: true,
    showOnBio: body.showOnBio !== false,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };
  links.unshift(link);
  await saveShareLinks(links);
  return NextResponse.json({ link }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    active?: boolean;
    showOnBio?: boolean;
    title?: string;
    target?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const links = await getShareLinks();
  const link = links.find((item) => item.id === body.id);
  if (!link) {
    return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
  }
  if (body.active !== undefined) link.active = body.active;
  if (body.showOnBio !== undefined) link.showOnBio = body.showOnBio;
  if (body.title !== undefined) link.title = body.title.trim() || link.title;
  if (body.target !== undefined) link.target = normalizeShareTarget(body.target);
  await saveShareLinks(links);
  return NextResponse.json({ link });
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
  const links = await getShareLinks();
  await saveShareLinks(links.filter((item) => item.id !== id));
  return NextResponse.json({ ok: true });
}
