import { createHash, randomBytes } from "crypto";
import type { PasswordReset } from "./types";
import { getPasswordResets, savePasswordResets } from "./store";

const RESET_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetToken() {
  return randomBytes(32).toString("hex");
}

export function getAppUrl(request: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function prunePasswordResets(items?: PasswordReset[]) {
  const now = Date.now();
  const current = items ?? (await getPasswordResets());
  const live = current.filter(
    (item) => new Date(item.expiresAt).getTime() > now
  );
  if (live.length !== current.length) {
    await savePasswordResets(live);
  }
  return live;
}

export async function issuePasswordReset(userId: string) {
  const items = await prunePasswordResets();
  const latest = items
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (
    latest &&
    Date.now() - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_MS
  ) {
    return { token: null as string | null, throttled: true };
  }

  const token = createResetToken();
  const now = new Date();
  const next = items.filter((item) => item.userId !== userId);
  next.push({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashResetToken(token),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RESET_TTL_MS).toISOString(),
  });
  await savePasswordResets(next);
  return { token, throttled: false };
}

export async function consumePasswordReset(token: string) {
  const items = await prunePasswordResets();
  const tokenHash = hashResetToken(token);
  const match = items.find((item) => item.tokenHash === tokenHash);
  if (!match) return null;
  await savePasswordResets(items.filter((item) => item.id !== match.id));
  return match;
}
