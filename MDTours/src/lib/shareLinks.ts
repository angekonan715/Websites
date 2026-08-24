export const reservedShareSlugs = new Set([
  "go",
  "liens",
  "admin",
  "api",
  "connexion",
  "voyages",
  "destinations",
  "contact",
  "historique",
  "a-propos",
]);

export function normalizeShareSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function normalizeShareTarget(value: string) {
  const target = value.trim();
  if (!target) return "/";
  if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("/")) {
    return target;
  }
  return `/${target}`;
}

export function buildShareRedirect(target: string, source: string, slug: string, origin: string) {
  const url = target.startsWith("http://") || target.startsWith("https://")
    ? new URL(target)
    : new URL(target, origin);
  if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", source);
  if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", "social");
  if (!url.searchParams.has("utm_campaign")) url.searchParams.set("utm_campaign", slug);
  return url.toString();
}
