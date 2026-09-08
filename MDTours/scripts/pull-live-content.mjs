import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import pg from "pg";

const SITE = process.env.LIVE_SITE_URL || "https://voyagezmdtours.com";
const ROOT = process.cwd();

const ENDPOINTS = [
  ["destinations", "/api/destinations"],
  ["mega-menus", "/api/mega-menus"],
  ["about", "/api/about"],
  ["hero", "/api/hero"],
  ["history", "/api/history"],
  ["testimonials", "/api/testimonials"],
  ["campaigns", "/api/campaigns"],
  ["personalized-catalog", "/api/personalized-catalog"],
];

function persistDestination(destination) {
  return {
    id: destination.id,
    country: destination.country,
    title: destination.title,
    duration: destination.duration,
    price: destination.price,
    rating: destination.rating,
    reviews: destination.reviews,
    image: destination.image,
    video: destination.video,
    gallery: destination.gallery,
    description: destination.description,
    location: destination.location?.trim() || undefined,
    itinerary: destination.itinerary ?? [],
    capacity: destination.capacity,
    promotionEnabled: Boolean(destination.promotionEnabled),
    promotionLabel: destination.promotionLabel,
    promotionPrice: destination.promotionPrice,
  };
}

async function fetchJson(pathname) {
  const response = await fetch(`${SITE}${pathname}`);
  if (!response.ok) {
    throw new Error(`${pathname} → ${response.status}`);
  }
  return response.json();
}

function collectUrls(value, into = new Set()) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    if (/\.(png|jpe?g|webp|gif|avif|mp4|webm)$/i.test(value.split("?")[0])) {
      into.add(value.split("?")[0]);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, into);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectUrls(item, into);
  }
  return into;
}

function localPathFor(urlPath) {
  const relative = urlPath.replace(/^\/+/, "");
  if (relative.startsWith("media/")) {
    return path.join(ROOT, "data", "uploads", ...relative.split("/").slice(1));
  }
  return path.join(ROOT, "public", ...relative.split("/"));
}

function seedPathFor(urlPath) {
  const relative = urlPath.replace(/^\/+/, "");
  if (relative.startsWith("media/")) {
    return path.join(ROOT, "data", "media-seed", ...relative.split("/").slice(1));
  }
  return null;
}

async function saveJson(filename, value) {
  const filePath = path.join(ROOT, "data", filename);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`wrote data/${filename}`);
}

async function download(urlPath) {
  const dest = localPathFor(urlPath);
  await mkdir(path.dirname(dest), { recursive: true });
  const response = await fetch(`${SITE}${urlPath}`);
  if (!response.ok) {
    console.log(`skip ${urlPath} (${response.status})`);
    return;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(dest, buffer);
  const seedDest = seedPathFor(urlPath);
  if (seedDest) {
    await mkdir(path.dirname(seedDest), { recursive: true });
    await writeFile(seedDest, buffer);
  }
  console.log(`downloaded ${urlPath} (${buffer.length} bytes)`);
}

const payloads = {};
for (const [name, pathname] of ENDPOINTS) {
  payloads[name] = await fetchJson(pathname);
}

await saveJson(
  "destinations.json",
  (payloads.destinations.destinations ?? []).map(persistDestination)
);
if (payloads["mega-menus"].menus) {
  await saveJson("mega-menus.json", payloads["mega-menus"].menus);
}
if (payloads.about.page) {
  await saveJson("about.json", payloads.about.page);
}
if (payloads.hero.hero) {
  await saveJson("hero.json", payloads.hero.hero);
}
if (payloads.history.trips) {
  await saveJson("history.json", payloads.history.trips);
}
if (payloads.testimonials.testimonials) {
  await saveJson("testimonials.json", payloads.testimonials.testimonials);
}
if (payloads.campaigns.campaigns?.length) {
  await saveJson("campaigns.json", payloads.campaigns.campaigns);
}
if (payloads["personalized-catalog"].catalog) {
  await saveJson("personalized-catalog.json", payloads["personalized-catalog"].catalog);
}

const extras = [
  "/background/hero.png",
  "/images/cape-coast.png",
  "/images/boti-waterfall.png",
  "/images/mole-national-park.png",
  "/images/beach.png",
  "/images/accra.png",
  "/images/kwame-nkrumah.png",
  "/images/waterfall.png",
  "/images/senegal.webp",
];
const urls = collectUrls(payloads);
for (const extra of extras) urls.add(extra);

for (const urlPath of [...urls].sort()) {
  await download(urlPath);
}

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  try {
    const env = await readFile(path.join(ROOT, ".env.local"), "utf8");
    const line = env.split(/\r?\n/).find((item) => item.startsWith("DATABASE_URL="));
    return line?.slice("DATABASE_URL=".length).trim() || "";
  } catch {
    return "";
  }
}

const databaseUrl = await loadDatabaseUrl();
if (databaseUrl) {
  const docs = [
    ["destinations", (payloads.destinations.destinations ?? []).map(persistDestination)],
    ["mega_menus", payloads["mega-menus"].menus],
    ["about", payloads.about.page],
    ["hero", payloads.hero.hero],
    ["history", payloads.history.trips],
    ["testimonials", payloads.testimonials.testimonials],
    ["personalized_catalog", payloads["personalized-catalog"].catalog],
  ].filter(([, value]) => value != null);
  if (payloads.campaigns.campaigns?.length) {
    docs.push(["campaigns", payloads.campaigns.campaigns]);
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: /localhost|127\.0\.0\.1/.test(databaseUrl)
      ? false
      : { rejectUnauthorized: false },
  });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cms_documents (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    for (const [key, value] of docs) {
      await pool.query(
        `INSERT INTO cms_documents (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, JSON.stringify(value)]
      );
    }
    console.log(`updated ${docs.length} CMS documents in local Postgres`);
  } finally {
    await pool.end();
  }
}

console.log("Live admin content is now in this project.");
