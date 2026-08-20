import { NextResponse } from "next/server";
import { getInvites } from "@/lib/store";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ valid: false });
  }
  const invite = (await getInvites()).find((item) => item.token === token);
  if (!invite) {
    return NextResponse.json({ valid: false, reason: "Lien invalide." });
  }
  if (invite.usedAt) {
    return NextResponse.json({ valid: false, reason: "Ce lien a déjà été utilisé." });
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ valid: false, reason: "Ce lien a expiré." });
  }
  return NextResponse.json({ valid: true, note: invite.note });
}
