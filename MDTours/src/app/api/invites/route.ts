import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createInviteToken, getInvites, saveInvites } from "@/lib/store";
import type { TestimonyInvite } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }
  const invites = await getInvites();
  return NextResponse.json({
    invites: invites.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = (await request.json()) as { note?: string };
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const invite: TestimonyInvite = {
    id: crypto.randomUUID(),
    token: createInviteToken(),
    note: body.note?.trim() || "Invitation témoignage",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const invites = await getInvites();
  invites.push(invite);
  await saveInvites(invites);

  return NextResponse.json({ invite }, { status: 201 });
}
