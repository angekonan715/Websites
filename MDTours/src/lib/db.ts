import { promises as fs } from "fs";
import path from "path";
import { Pool, type QueryResultRow } from "pg";
import type {
  ClientNote,
  CustomTripRequest,
  PasswordReset,
  Reservation,
  User,
} from "./types";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  user_id TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  destination_title TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  departure_date TEXT NOT NULL DEFAULT '',
  travelers INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'awaiting_contact',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_confirmed_at TIMESTAMPTZ,
  appointment_confirmed_at TIMESTAMPTZ,
  confirmation_email_sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS reservations_user_id_idx ON reservations (user_id);
CREATE INDEX IF NOT EXISTS reservations_email_idx ON reservations (email);

CREATE TABLE IF NOT EXISTS custom_trips (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  travel_kind TEXT NOT NULL DEFAULT 'personnalise',
  travel_kind_label TEXT NOT NULL DEFAULT 'Voyage personnalisé',
  destination TEXT NOT NULL DEFAULT '',
  departure_date TEXT NOT NULL DEFAULT '',
  return_date TEXT NOT NULL DEFAULT '',
  travelers INTEGER NOT NULL DEFAULT 1,
  adults INTEGER,
  children_under_12 INTEGER,
  children_under_16 INTEGER,
  accommodation TEXT,
  vehicle TEXT,
  cities JSONB,
  activity_ids JSONB,
  nights INTEGER,
  quote JSONB,
  budget TEXT NOT NULL DEFAULT '',
  suggestion TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  proposal_title TEXT,
  proposal_details TEXT,
  proposed_price INTEGER,
  proposed_duration TEXT,
  quote_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS custom_trips_user_id_idx ON custom_trips (user_id);
CREATE INDEX IF NOT EXISTS custom_trips_email_idx ON custom_trips (email);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS password_resets_token_hash_idx ON password_resets (token_hash);
CREATE INDEX IF NOT EXISTS password_resets_user_id_idx ON password_resets (user_id);

CREATE TABLE IF NOT EXISTS client_notes (
  id TEXT PRIMARY KEY,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

type QueryFn = <T extends QueryResultRow>(
  text: string,
  params?: unknown[]
) => Promise<{ rows: T[]; rowCount: number | null }>;

const globalForDb = globalThis as unknown as {
  mdtoursPgQuery?: QueryFn;
  mdtoursPgReady?: Promise<void>;
};

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

export function hasDatabaseUrl() {
  return Boolean(databaseUrl());
}

function isLocalUrl(url: string) {
  return /localhost|127\.0\.0\.1/.test(url);
}

async function createQuery(): Promise<QueryFn> {
  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing. Use npm run dev (it starts a local Postgres) or set DATABASE_URL for Railway/Docker."
    );
  }
  const pool = new Pool({
    connectionString: url,
    max: 10,
    ssl: isLocalUrl(url) ? false : { rejectUnauthorized: false },
  });
  return async (text, params = []) => {
    const result = await pool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  };
}

async function getQuery(): Promise<QueryFn> {
  if (!globalForDb.mdtoursPgQuery) {
    globalForDb.mdtoursPgQuery = await createQuery();
  }
  return globalForDb.mdtoursPgQuery;
}

async function rawQuery<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const run = await getQuery();
  return run<T>(text, params);
}

async function initDb() {
  const statements = SCHEMA_SQL.split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await rawQuery(statement);
  }
  await importJsonIfEmpty();
}

export async function ensureDb() {
  if (!globalForDb.mdtoursPgReady) {
    globalForDb.mdtoursPgReady = initDb().catch((error) => {
      globalForDb.mdtoursPgReady = undefined;
      throw error;
    });
  }
  await globalForDb.mdtoursPgReady;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureDb();
  return rawQuery<T>(text, params);
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function iso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function isoRequired(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function asJson<T>(value: T | string | null | undefined): T | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value;
}

function jsonParam(value: unknown) {
  if (value == null) return null;
  return JSON.stringify(value);
}

async function tableCount(table: string) {
  const { rows } = await rawQuery<{ n: string | number }>(
    `SELECT COUNT(*)::int AS n FROM ${table}`
  );
  return Number(rows[0]?.n ?? 0);
}

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function importJsonIfEmpty() {
  const users = await readJsonFile<User[]>("users.json", []);
  const reservations = await readJsonFile<Reservation[]>("reservations.json", []);
  const customTrips = await readJsonFile<CustomTripRequest[]>("custom-trips.json", []);
  const resets = await readJsonFile<PasswordReset[]>("password-resets.json", []);
  const notes = await readJsonFile<ClientNote[]>("client-notes.json", []);

  const needUsers = (await tableCount("users")) === 0 && users.length > 0;
  const needReservations = (await tableCount("reservations")) === 0 && reservations.length > 0;
  const needCustom = (await tableCount("custom_trips")) === 0 && customTrips.length > 0;
  const needResets = (await tableCount("password_resets")) === 0 && resets.length > 0;
  const needNotes = (await tableCount("client_notes")) === 0 && notes.length > 0;
  if (!needUsers && !needReservations && !needCustom && !needResets && !needNotes) {
    return;
  }

  for (const user of users) {
    await rawQuery(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt]
    );
  }

  for (const item of reservations) {
    await insertReservationRow(item, rawQuery);
  }

  for (const item of customTrips) {
    await insertCustomTripRow(item, rawQuery);
  }

  for (const item of resets) {
    await rawQuery(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [item.id, item.userId, item.tokenHash, item.expiresAt, item.createdAt]
    );
  }

  for (const item of notes) {
    await rawQuery(
      `INSERT INTO client_notes (id, notes, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [item.id, item.notes, item.updatedAt]
    );
  }

  if (users.length || reservations.length || customTrips.length) {
    console.info(
      `[db] Imported ${users.length} users, ${reservations.length} reservations, ${customTrips.length} custom trips from JSON.`
    );
  }
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: User["role"];
  created_at: Date | string;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: isoRequired(row.created_at),
  };
}

type ReservationRow = {
  id: string;
  reference: string;
  user_id: string;
  destination_id: string;
  destination_title: string;
  country: string;
  duration: string;
  image: string;
  name: string;
  email: string;
  phone: string;
  departure_date: string;
  travelers: number;
  unit_price: number | string;
  total_price: number | string;
  notes: string;
  status: Reservation["status"];
  created_at: Date | string;
  updated_at: Date | string;
  payment_confirmed_at: Date | string | null;
  appointment_confirmed_at: Date | string | null;
  confirmation_email_sent_at: Date | string | null;
};

function mapReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    destinationId: row.destination_id,
    destinationTitle: row.destination_title,
    country: row.country,
    duration: row.duration,
    image: row.image,
    name: row.name,
    email: row.email,
    phone: row.phone,
    departureDate: row.departure_date ?? "",
    travelers: Number(row.travelers),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    notes: row.notes ?? "",
    status: row.status,
    createdAt: isoRequired(row.created_at),
    updatedAt: isoRequired(row.updated_at),
    paymentConfirmedAt: iso(row.payment_confirmed_at),
    appointmentConfirmedAt: iso(row.appointment_confirmed_at),
    confirmationEmailSentAt: iso(row.confirmation_email_sent_at),
  };
}

type CustomTripRow = {
  id: string;
  reference: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  travel_kind: string;
  travel_kind_label: string;
  destination: string;
  departure_date: string;
  return_date: string;
  travelers: number;
  adults: number | null;
  children_under_12: number | null;
  children_under_16: number | null;
  accommodation: CustomTripRequest["accommodation"] | null;
  vehicle: CustomTripRequest["vehicle"] | null;
  cities: string[] | null;
  activity_ids: string[] | null;
  nights: number | null;
  quote: CustomTripRequest["quote"] | null;
  budget: string;
  suggestion: string;
  status: CustomTripRequest["status"];
  proposal_title: string | null;
  proposal_details: string | null;
  proposed_price: number | string | null;
  proposed_duration: string | null;
  quote_email_sent_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapCustomTrip(row: CustomTripRow): CustomTripRequest {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    travelKind: row.travel_kind,
    travelKindLabel: row.travel_kind_label,
    destination: row.destination,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    travelers: Number(row.travelers),
    adults: row.adults ?? undefined,
    childrenUnder12: row.children_under_12 ?? undefined,
    childrenUnder16: row.children_under_16 ?? undefined,
    accommodation: row.accommodation ?? undefined,
    vehicle: row.vehicle ?? undefined,
    cities: asJson<string[]>(row.cities),
    activityIds: asJson<string[]>(row.activity_ids),
    nights: row.nights ?? undefined,
    quote: asJson<CustomTripRequest["quote"]>(row.quote),
    budget: row.budget,
    suggestion: row.suggestion,
    status: row.status,
    proposalTitle: row.proposal_title ?? undefined,
    proposalDetails: row.proposal_details ?? undefined,
    proposedPrice: row.proposed_price == null ? undefined : Number(row.proposed_price),
    proposedDuration: row.proposed_duration ?? undefined,
    quoteEmailSentAt: iso(row.quote_email_sent_at),
    createdAt: isoRequired(row.created_at),
    updatedAt: isoRequired(row.updated_at),
  };
}

async function insertReservationRow(item: Reservation, run: QueryFn) {
  await run(
    `INSERT INTO reservations (
      id, reference, user_id, destination_id, destination_title, country, duration, image,
      name, email, phone, departure_date, travelers, unit_price, total_price, notes, status,
      created_at, updated_at, payment_confirmed_at, appointment_confirmed_at, confirmation_email_sent_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    ON CONFLICT (id) DO NOTHING`,
    [
      item.id,
      item.reference,
      item.userId,
      item.destinationId,
      item.destinationTitle,
      item.country,
      item.duration,
      item.image,
      item.name,
      item.email,
      item.phone,
      item.departureDate ?? "",
      item.travelers,
      item.unitPrice,
      item.totalPrice,
      item.notes ?? "",
      item.status,
      item.createdAt,
      item.updatedAt,
      item.paymentConfirmedAt ?? null,
      item.appointmentConfirmedAt ?? null,
      item.confirmationEmailSentAt ?? null,
    ]
  );
}

async function insertCustomTripRow(item: CustomTripRequest, run: QueryFn) {
  await run(
    `INSERT INTO custom_trips (
      id, reference, user_id, name, email, phone, travel_kind, travel_kind_label, destination,
      departure_date, return_date, travelers, adults, children_under_12, children_under_16,
      accommodation, vehicle, cities, activity_ids, nights, quote, budget, suggestion, status,
      proposal_title, proposal_details, proposed_price, proposed_duration, quote_email_sent_at,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
    )
    ON CONFLICT (id) DO NOTHING`,
    [
      item.id,
      item.reference,
      item.userId,
      item.name,
      item.email,
      item.phone,
      item.travelKind,
      item.travelKindLabel,
      item.destination,
      item.departureDate,
      item.returnDate,
      item.travelers,
      item.adults ?? null,
      item.childrenUnder12 ?? null,
      item.childrenUnder16 ?? null,
      item.accommodation ?? null,
      item.vehicle ?? null,
      jsonParam(item.cities),
      jsonParam(item.activityIds),
      item.nights ?? null,
      jsonParam(item.quote),
      item.budget,
      item.suggestion,
      item.status,
      item.proposalTitle ?? null,
      item.proposalDetails ?? null,
      item.proposedPrice ?? null,
      item.proposedDuration ?? null,
      item.quoteEmailSentAt ?? null,
      item.createdAt,
      item.updatedAt,
    ]
  );
}

export async function dbGetUsers() {
  const { rows } = await query<UserRow>("SELECT * FROM users ORDER BY created_at ASC");
  return rows.map(mapUser);
}

export async function dbGetUserByEmail(email: string) {
  const { rows } = await query<UserRow>("SELECT * FROM users WHERE lower(email) = $1 LIMIT 1", [
    email.trim().toLowerCase(),
  ]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function dbGetUserById(id: string) {
  const { rows } = await query<UserRow>("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function dbInsertUser(user: User) {
  await query(
    `INSERT INTO users (id, name, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt]
  );
}

export async function dbUpdateUser(user: User) {
  await query(
    `UPDATE users SET name = $2, email = $3, password_hash = $4, role = $5 WHERE id = $1`,
    [user.id, user.name, user.email, user.passwordHash, user.role]
  );
}

export async function dbGetReservations() {
  const { rows } = await query<ReservationRow>(
    "SELECT * FROM reservations ORDER BY created_at DESC"
  );
  return rows.map(mapReservation);
}

export async function dbGetReservationById(id: string) {
  const { rows } = await query<ReservationRow>(
    "SELECT * FROM reservations WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ? mapReservation(rows[0]) : null;
}

export async function dbInsertReservation(item: Reservation) {
  await insertReservationRow(item, (text, params) => query(text, params));
}

export async function dbUpdateReservation(item: Reservation) {
  await query(
    `UPDATE reservations SET
      reference = $2, user_id = $3, destination_id = $4, destination_title = $5, country = $6,
      duration = $7, image = $8, name = $9, email = $10, phone = $11, departure_date = $12,
      travelers = $13, unit_price = $14, total_price = $15, notes = $16, status = $17,
      updated_at = $18, payment_confirmed_at = $19, appointment_confirmed_at = $20,
      confirmation_email_sent_at = $21
     WHERE id = $1`,
    [
      item.id,
      item.reference,
      item.userId,
      item.destinationId,
      item.destinationTitle,
      item.country,
      item.duration,
      item.image,
      item.name,
      item.email,
      item.phone,
      item.departureDate ?? "",
      item.travelers,
      item.unitPrice,
      item.totalPrice,
      item.notes ?? "",
      item.status,
      item.updatedAt,
      item.paymentConfirmedAt ?? null,
      item.appointmentConfirmedAt ?? null,
      item.confirmationEmailSentAt ?? null,
    ]
  );
}

export async function dbGetCustomTrips() {
  const { rows } = await query<CustomTripRow>(
    "SELECT * FROM custom_trips ORDER BY created_at DESC"
  );
  return rows.map(mapCustomTrip);
}

export async function dbGetCustomTripById(id: string) {
  const { rows } = await query<CustomTripRow>(
    "SELECT * FROM custom_trips WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] ? mapCustomTrip(rows[0]) : null;
}

export async function dbInsertCustomTrip(item: CustomTripRequest) {
  await insertCustomTripRow(item, (text, params) => query(text, params));
}

export async function dbUpdateCustomTrip(item: CustomTripRequest) {
  await query(
    `UPDATE custom_trips SET
      reference = $2, user_id = $3, name = $4, email = $5, phone = $6, travel_kind = $7,
      travel_kind_label = $8, destination = $9, departure_date = $10, return_date = $11,
      travelers = $12, adults = $13, children_under_12 = $14, children_under_16 = $15,
      accommodation = $16, vehicle = $17, cities = $18, activity_ids = $19, nights = $20,
      quote = $21, budget = $22, suggestion = $23, status = $24, proposal_title = $25,
      proposal_details = $26, proposed_price = $27, proposed_duration = $28,
      quote_email_sent_at = $29, updated_at = $30
     WHERE id = $1`,
    [
      item.id,
      item.reference,
      item.userId,
      item.name,
      item.email,
      item.phone,
      item.travelKind,
      item.travelKindLabel,
      item.destination,
      item.departureDate,
      item.returnDate,
      item.travelers,
      item.adults ?? null,
      item.childrenUnder12 ?? null,
      item.childrenUnder16 ?? null,
      item.accommodation ?? null,
      item.vehicle ?? null,
      jsonParam(item.cities),
      jsonParam(item.activityIds),
      item.nights ?? null,
      jsonParam(item.quote),
      item.budget,
      item.suggestion,
      item.status,
      item.proposalTitle ?? null,
      item.proposalDetails ?? null,
      item.proposedPrice ?? null,
      item.proposedDuration ?? null,
      item.quoteEmailSentAt ?? null,
      item.updatedAt,
    ]
  );
}

export async function dbGetClientNotes() {
  const { rows } = await query<{ id: string; notes: string; updated_at: Date | string }>(
    "SELECT * FROM client_notes ORDER BY updated_at DESC"
  );
  return rows.map((row) => ({
    id: row.id,
    notes: row.notes,
    updatedAt: isoRequired(row.updated_at),
  }));
}

export async function dbUpsertClientNote(note: ClientNote) {
  await query(
    `INSERT INTO client_notes (id, notes, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at`,
    [note.id, note.notes, note.updatedAt]
  );
}

export async function dbPrunePasswordResets() {
  await query("DELETE FROM password_resets WHERE expires_at <= NOW()");
}

export async function dbLatestPasswordReset(userId: string) {
  const { rows } = await query<{ created_at: Date | string }>(
    `SELECT created_at FROM password_resets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ? isoRequired(rows[0].created_at) : null;
}

export async function dbReplacePasswordReset(item: PasswordReset) {
  await query("DELETE FROM password_resets WHERE user_id = $1", [item.userId]);
  await query(
    `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [item.id, item.userId, item.tokenHash, item.expiresAt, item.createdAt]
  );
}

export async function dbConsumePasswordReset(tokenHash: string) {
  const { rows } = await query<{
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date | string;
    created_at: Date | string;
  }>(
    `SELECT * FROM password_resets
     WHERE token_hash = $1 AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  await query("DELETE FROM password_resets WHERE id = $1", [row.id]);
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: isoRequired(row.expires_at),
    createdAt: isoRequired(row.created_at),
  } satisfies PasswordReset;
}
