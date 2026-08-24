import { createHash, randomBytes } from "crypto";
import {
  dbConsumePasswordReset,
  dbLatestPasswordReset,
  dbPrunePasswordResets,
  dbReplacePasswordReset,
} from "./db";

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

export async function issuePasswordReset(userId: string) {
  await dbPrunePasswordResets();
  const latest = await dbLatestPasswordReset(userId);
  if (latest && Date.now() - new Date(latest).getTime() < RESEND_COOLDOWN_MS) {
    return { token: null as string | null, throttled: true };
  }

  const token = createResetToken();
  const now = new Date();
  await dbReplacePasswordReset({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashResetToken(token),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RESET_TTL_MS).toISOString(),
  });
  return { token, throttled: false };
}

export async function consumePasswordReset(token: string) {
  await dbPrunePasswordResets();
  return dbConsumePasswordReset(hashResetToken(token));
}
