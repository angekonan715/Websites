import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { persistDestination, withAvailability } from "./availability";
import { keepLiveCampaigns } from "./campaigns";
import {
  dbGetClientNotes,
  dbGetCustomTripById,
  dbGetCustomTrips,
  dbGetReservationById,
  dbGetReservations,
  dbGetUserByEmail,
  dbGetUserById,
  dbGetUsers,
  dbInsertCustomTrip,
  dbInsertReservation,
  dbInsertUser,
  dbUpdateCustomTrip,
  dbUpdateReservation,
  dbUpdateUser,
  dbUpsertClientNote,
  hasDatabaseUrl,
} from "./db";
import { saveRawUpload } from "./media";
import type {
  AboutPage,
  Campaign,
  ClientNote,
  ContactMessage,
  CustomTripRequest,
  Destination,
  HistoryTrip,
  PersonalizedCatalog,
  Reservation,
  ShareLink,
  Testimonial,
  TestimonyInvite,
  User,
  MegaMenus,
  HeroSettings,
} from "./types";
import { defaultMegaMenus, enrichMegaMenus } from "./megaMenus";

const dataDir = path.join(process.cwd(), "data");
const destinationsPath = path.join(dataDir, "destinations.json");
const testimonialsPath = path.join(dataDir, "testimonials.json");
const invitesPath = path.join(dataDir, "invites.json");
const messagesPath = path.join(dataDir, "messages.json");
const historyPath = path.join(dataDir, "history.json");
const personalizedCatalogPath = path.join(dataDir, "personalized-catalog.json");
const aboutPath = path.join(dataDir, "about.json");
const campaignsPath = path.join(dataDir, "campaigns.json");
const shareLinksPath = path.join(dataDir, "share-links.json");
const megaMenusPath = path.join(dataDir, "mega-menus.json");
const heroPath = path.join(dataDir, "hero.json");

const defaultAbout: AboutPage = {
  kicker: "À propos",
  title: "MD Tours, pour voyager autrement",
  subtitle:
    "Nous concevons des séjours authentiques en Afrique, avec un accompagnement humain avant, pendant et après le voyage.",
  blocks: [
    {
      id: "intro",
      type: "paragraph",
      text: "MD Tours est née d’une conviction simple : l’Afrique se vit intensément quand le voyage est préparé avec soin. Nous organisons des expériences au Ghana et en Afrique de l’Ouest — villes, patrimoine, nature et rencontres — pour des voyageurs qui veulent plus qu’un séjour standard.",
    },
    {
      id: "suivi",
      type: "paragraph",
      text: "Notre équipe s’occupe des itinéraires, des hébergements, des transferts et du suivi. Vous restez libres de savourer le moment ; nous veillons à ce que chaque étape soit claire, sûre et mémorable.",
    },
  ],
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function getStoredDestinations(): Promise<Destination[]> {
  const raw = await fs.readFile(destinationsPath, "utf8");
  return JSON.parse(raw) as Destination[];
}

export async function getDestinations(): Promise<Destination[]> {
  const destinations = await getStoredDestinations();
  const reservations = hasDatabaseUrl() ? await getReservations() : [];
  return destinations.map((destination) =>
    withAvailability(destination, reservations)
  );
}

export async function saveDestinations(destinations: Destination[]) {
  await ensureDataDir();
  await fs.writeFile(
    destinationsPath,
    JSON.stringify(destinations.map(persistDestination), null, 2),
    "utf8"
  );
}

export async function getUsers(): Promise<User[]> {
  return dbGetUsers();
}

export async function getUserByEmail(email: string) {
  return dbGetUserByEmail(email);
}

export async function getUserById(id: string) {
  return dbGetUserById(id);
}

export async function insertUser(user: User) {
  await dbInsertUser(user);
}

export async function updateUser(user: User) {
  await dbUpdateUser(user);
}

export async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@voyagezmdtours.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "MDs1996@@";
  const existing = await dbGetUserByEmail(email);

  if (!existing) {
    const seeded = await dbGetUserById("admin");
    if (seeded) {
      seeded.email = email;
      seeded.role = "admin";
      await dbUpdateUser(seeded);
      return;
    }
    await dbInsertUser({
      id: "admin",
      name: "Administrateur",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    return;
  }

  if (existing.role !== "admin") {
    existing.role = "admin";
    await dbUpdateUser(existing);
  }
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getReservations(): Promise<Reservation[]> {
  return dbGetReservations();
}

export async function getReservationById(id: string) {
  return dbGetReservationById(id);
}

export async function insertReservation(item: Reservation) {
  await dbInsertReservation(item);
}

export async function updateReservation(item: Reservation) {
  await dbUpdateReservation(item);
}

export function createBookingReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MDT-${code}`;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function getTestimonials() {
  return readJson<Testimonial[]>(testimonialsPath, []);
}

export async function saveTestimonials(items: Testimonial[]) {
  await writeJson(testimonialsPath, items);
}

export async function getInvites() {
  return readJson<TestimonyInvite[]>(invitesPath, []);
}

export async function saveInvites(items: TestimonyInvite[]) {
  await writeJson(invitesPath, items);
}

export async function getContactMessages() {
  return readJson<ContactMessage[]>(messagesPath, []);
}

export async function saveContactMessages(items: ContactMessage[]) {
  await writeJson(messagesPath, items);
}

export function createInviteToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export const defaultHeroSettings: HeroSettings = {
  image: "/background/hero.png",
  video: "",
  alt: "Voyage MD Tours",
};

export async function getHeroSettings(): Promise<HeroSettings> {
  const stored = await readJson<Partial<HeroSettings> | null>(heroPath, null);
  return {
    image: stored?.image?.trim() || defaultHeroSettings.image,
    video: stored?.video?.trim() || "",
    alt: stored?.alt?.trim() || defaultHeroSettings.alt,
    sourceLabel: stored?.sourceLabel?.trim() || "",
    updatedAt: stored?.updatedAt,
  };
}

export async function saveHeroSettings(settings: HeroSettings) {
  await writeJson(heroPath, settings);
}

export async function savePublicFile(
  file: File,
  folder: "images" | "video",
  basename: string
) {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  let extension = "";
  if (type === "image/png" || name.endsWith(".png")) extension = ".png";
  else if (type === "image/webp" || name.endsWith(".webp")) extension = ".webp";
  else if (type.includes("jpeg") || type === "image/jpg" || /\.jpe?g$/.test(name))
    extension = ".jpg";
  else if (type === "video/mp4" || name.endsWith(".mp4")) extension = ".mp4";
  else if (type === "video/webm" || name.endsWith(".webm")) extension = ".webm";
  else throw new Error("Format de fichier non pris en charge. Utilisez JPG, PNG, WEBP ou MP4.");

  const filenameBase = basename;
  const destFolder = folder === "video" ? "video" : "images";
  return saveRawUpload(file, destFolder, filenameBase, extension);
}

export async function getCustomTrips() {
  return dbGetCustomTrips();
}

export async function getCustomTripById(id: string) {
  return dbGetCustomTripById(id);
}

export async function insertCustomTrip(item: CustomTripRequest) {
  await dbInsertCustomTrip(item);
}

export async function updateCustomTrip(item: CustomTripRequest) {
  await dbUpdateCustomTrip(item);
}

export async function getHistoryTrips() {
  return readJson<HistoryTrip[]>(historyPath, []);
}

export async function saveHistoryTrips(items: HistoryTrip[]) {
  await writeJson(historyPath, items);
}

export async function getPersonalizedCatalog() {
  return readJson<PersonalizedCatalog>(personalizedCatalogPath, {
    currency: "FCFA",
    note: "",
    accommodations: [],
    vehicles: [],
    cities: [],
  });
}

export async function savePersonalizedCatalog(catalog: PersonalizedCatalog) {
  await writeJson(personalizedCatalogPath, catalog);
}

export async function getAboutPage(): Promise<AboutPage> {
  const page = await readJson<AboutPage | null>(aboutPath, null);
  if (!page || !page.title) return defaultAbout;
  return {
    ...defaultAbout,
    ...page,
    blocks: Array.isArray(page.blocks) ? page.blocks : defaultAbout.blocks,
  };
}

export async function saveAboutPage(page: AboutPage) {
  await writeJson(aboutPath, page);
}

export async function getCampaigns(): Promise<Campaign[]> {
  const items = await readJson<Campaign[]>(campaignsPath, []);
  const live = keepLiveCampaigns(items);
  if (live.length !== items.length) {
    await writeJson(campaignsPath, live);
  }
  return live;
}

export async function saveCampaigns(items: Campaign[]) {
  await writeJson(campaignsPath, items);
}

export async function getClientNotes(): Promise<ClientNote[]> {
  return dbGetClientNotes();
}

export async function upsertClientNote(note: ClientNote) {
  await dbUpsertClientNote(note);
}

export async function getShareLinks(): Promise<ShareLink[]> {
  return readJson<ShareLink[]>(shareLinksPath, []);
}

export async function saveShareLinks(items: ShareLink[]) {
  await writeJson(shareLinksPath, items);
}

export async function getStoredMegaMenus(): Promise<MegaMenus> {
  const stored = await readJson<Partial<MegaMenus> | null>(megaMenusPath, null);
  return {
    destinations:
      stored?.destinations && stored.destinations.length > 0
        ? stored.destinations
        : defaultMegaMenus.destinations,
    voyages:
      stored?.voyages && stored.voyages.length > 0
        ? stored.voyages
        : defaultMegaMenus.voyages,
  };
}

export async function getMegaMenus(): Promise<MegaMenus> {
  return enrichMegaMenus(await getStoredMegaMenus(), await getStoredDestinations());
}

export async function saveMegaMenus(menus: MegaMenus) {
  await writeJson(megaMenusPath, menus);
}
