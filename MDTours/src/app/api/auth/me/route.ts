import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureAdminUser } from "@/lib/store";

export async function GET() {
  await ensureAdminUser();
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
