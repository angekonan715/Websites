import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type {
  ContactMessage,
  CustomTripRequest,
  Destination,
  HistoryTrip,
  PersonalizedCatalog,
  Reservation,
  Testimonial,
  TestimonyInvite,
  User,
} from "./types";

const dataDir = path.join(process.cwd(), "data");
const destinationsPath = path.join(dataDir, "destinations.json");
const usersPath = path.join(dataDir, "users.json");
const reservationsPath = path.join(dataDir, "reservations.json");
const testimonialsPath = path.join(dataDir, "testimonials.json");
const invitesPath = path.join(dataDir, "invites.json");
const messagesPath = path.join(dataDir, "messages.json");
const customTripsPath = path.join(dataDir, "custom-trips.json");
const historyPath = path.join(dataDir, "history.json");
const personalizedCatalogPath = path.join(dataDir, "personalized-catalog.json");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function getDestinations(): Promise<Destination[]> {
  const raw = await fs.readFile(destinationsPath, "utf8");
  return JSON.parse(raw) as Destination[];
}

export async function saveDestinations(destinations: Destination[]) {
  await ensureDataDir();
  await fs.writeFile(
    destinationsPath,
    JSON.stringify(destinations, null, 2),
    "utf8"
  );
}

export async function getUsers(): Promise<User[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(usersPath, "utf8");
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

export async function saveUsers(users: User[]) {
  await ensureDataDir();
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");
}

export async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@mdtours.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const users = await getUsers();
  const existing = users.find((user) => user.email === email);

  if (!existing) {
    users.push({
      id: "admin",
      name: "Administrateur",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    await saveUsers(users);
    return;
  }

  if (existing.role !== "admin") {
    existing.role = "admin";
    await saveUsers(users);
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
  await ensureDataDir();
  try {
    const raw = await fs.readFile(reservationsPath, "utf8");
    return JSON.parse(raw) as Reservation[];
  } catch {
    return [];
  }
}

export async function saveReservations(reservations: Reservation[]) {
  await ensureDataDir();
  await fs.writeFile(
    reservationsPath,
    JSON.stringify(reservations, null, 2),
    "utf8"
  );
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

export async function savePublicFile(
  file: File,
  folder: "images" | "video",
  basename: string
) {
  const type = file.type;
  let extension = "";
  if (type === "image/png") extension = ".png";
  else if (type === "image/webp") extension = ".webp";
  else if (type === "image/jpeg" || type === "image/jpg") extension = ".jpg";
  else if (type === "video/mp4") extension = ".mp4";
  else if (type === "video/webm") extension = ".webm";
  else throw new Error("Format de fichier non pris en charge.");

  const filename = `${basename}${extension}`;
  const dir = path.join(process.cwd(), "public", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, filename),
    Buffer.from(await file.arrayBuffer())
  );
  return `/${folder}/${filename}`;
}

export async function getCustomTrips() {
  return readJson<CustomTripRequest[]>(customTripsPath, []);
}

export async function saveCustomTrips(items: CustomTripRequest[]) {
  await writeJson(customTripsPath, items);
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
