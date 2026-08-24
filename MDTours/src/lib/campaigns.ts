import type { Campaign } from "./types";

export function isCampaignExpired(campaign: Pick<Campaign, "expiresAt">, now = Date.now()) {
  if (!campaign.expiresAt) return false;
  const expires = Date.parse(campaign.expiresAt);
  return Number.isNaN(expires) || expires <= now;
}

export function parseCampaignExpiry(value?: string) {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const date = raw.includes("T") ? new Date(raw) : new Date(`${raw}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function keepLiveCampaigns(items: Campaign[], now = Date.now()) {
  return items.filter((item) => !isCampaignExpired(item, now));
}
