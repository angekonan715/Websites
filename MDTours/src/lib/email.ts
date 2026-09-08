import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { agencyContact, formatPrice, reservationStatusLabel } from "@/data/home";
import type { CustomTripRequest, Destination, Reservation, ReservationStatus } from "@/lib/types";

const ATTEMPT_TIMEOUT_MS = 8_000;
const RAILWAY_SMTP_BLOCKED =
  "Railway bloque l’envoi SMTP (ports 465 et 587) sur les plans Free et Hobby. Ce n’est pas le mot de passe Zoho. Deux options : passer le projet Railway en Pro puis redéployer, ou ajouter RESEND_API_KEY (envoi HTTPS, fonctionne sur Hobby).";

function resendApiKey() {
  return process.env.RESEND_API_KEY?.trim() || "";
}

function smtpCredentials() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim();
  if (!host || !user || !pass) return null;
  return { host, user, pass };
}

function addressList(value: nodemailer.SendMailOptions["to"]) {
  if (!value) return [];
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "address" in item) {
        return String(item.address || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

async function sendViaResend(options: nodemailer.SendMailOptions) {
  const apiKey = resendApiKey();
  const to = addressList(options.to);
  if (!apiKey) {
    throw new Error("RESEND_API_KEY manquante.");
  }
  if (!to.length) {
    throw new Error("Destinataire email manquant.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: String(options.from || fromAddress()),
      to,
      ...(addressList(options.cc).length ? { cc: addressList(options.cc) } : {}),
      ...(addressList(options.replyTo)[0]
        ? { reply_to: addressList(options.replyTo)[0] }
        : {}),
      subject: String(options.subject || ""),
      text: typeof options.text === "string" ? options.text : undefined,
      html: typeof options.html === "string" ? options.html : undefined,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    name?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || payload.name || `Resend HTTP ${response.status}`);
  }
}

function createTransporter(host: string, user: string, pass: string, port: number) {
  const secure = port === 465;
  const options: SMTPTransport.Options = {
    host,
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: ATTEMPT_TIMEOUT_MS,
    greetingTimeout: ATTEMPT_TIMEOUT_MS,
    socketTimeout: ATTEMPT_TIMEOUT_MS,
    auth: { user, pass },
    tls: {
      minVersion: "TLSv1.2",
      servername: host,
      rejectUnauthorized: true,
    },
  };
  return nodemailer.createTransport(options);
}

function smtpTargets(primaryHost: string) {
  const configured = Number(process.env.SMTP_PORT || 0);
  const preferred = configured === 465 || configured === 587 ? configured : 465;
  const ports = preferred === 465 ? [465, 587] : [587, 465];
  const hosts = new Set<string>([primaryHost]);
  if (primaryHost.includes("zoho.com") && !primaryHost.includes("smtppro")) {
    hosts.add(primaryHost.replace("smtp.", "smtppro."));
  }
  if (primaryHost.includes("smtppro.zoho.")) {
    hosts.add(primaryHost.replace("smtppro.", "smtp."));
  }
  return [...hosts].flatMap((host) => ports.map((port) => ({ host, port })));
}

function smtpErrorMessage(error: unknown, host: string, port: number) {
  const raw = error instanceof Error ? error.message : String(error);
  return `${host}:${port} — ${raw}`;
}

async function sendMail(options: nodemailer.SendMailOptions) {
  if (resendApiKey()) {
    await sendViaResend(options);
    console.info("Email sent via Resend HTTPS");
    return;
  }

  const creds = smtpCredentials();
  if (!creds) {
    throw new Error(
      "Email non envoyé : sur Railway Hobby, ajoutez RESEND_API_KEY. Sinon configurez SMTP_HOST, SMTP_USER et SMTP_PASS (Railway Pro uniquement)."
    );
  }

  const attempts = smtpTargets(creds.host);
  const failures: string[] = [];
  for (const attempt of attempts) {
    const transporter = createTransporter(attempt.host, creds.user, creds.pass, attempt.port);
    try {
      await transporter.sendMail(options);
      console.info(`SMTP sent via ${attempt.host}:${attempt.port}`);
      return;
    } catch (error) {
      const detail = smtpErrorMessage(error, attempt.host, attempt.port);
      failures.push(detail);
      console.error(`SMTP send failed on ${detail}`);
    } finally {
      transporter.close();
    }
  }

  const timedOut = failures.every((line) => /timeout|ETIMEDOUT|ECONNRESET|ENETUNREACH/i.test(line));
  if (timedOut) {
    throw new Error(RAILWAY_SMTP_BLOCKED);
  }

  throw new Error(`Envoi email impossible. ${failures.join(" | ")}`);
}

export async function sendTestEmail(to: string) {
  await sendMail({
    from: fromAddress(),
    to,
    subject: "Test SMTP MD Tours",
    text: "Ceci est un email de test. Si vous le recevez, l’envoi Zoho fonctionne.",
    html: "<p>Ceci est un email de test. Si vous le recevez, l’envoi Zoho fonctionne.</p>",
  });
}

export function isEmailConfigured() {
  if (resendApiKey()) return true;
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

function itineraryText(destination?: Destination) {
  if (!destination) return "";
  const days = [...(destination.itinerary ?? [])].sort((a, b) => a.day - b.day);
  if (!destination.location && days.length === 0) return "";
  const lines = ["", "Programme du voyage"];
  if (destination.location) {
    lines.push("", destination.location);
  }
  for (const day of days) {
    lines.push("", `Jour ${day.day}${day.title ? ` — ${day.title}` : ""}`);
    if (day.description) lines.push(day.description);
  }
  return lines.join("\n");
}

function itineraryHtml(destination?: Destination) {
  if (!destination) return "";
  const days = [...(destination.itinerary ?? [])].sort((a, b) => a.day - b.day);
  if (!destination.location && days.length === 0) return "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.voyagezmdtours.com").replace(
    /\/$/,
    ""
  );
  const dayBlocks = days
    .map((day) => {
      const src = day.image
        ? day.image.startsWith("http")
          ? day.image
          : `${siteUrl}${day.image}`
        : "";
      const image = src
        ? `<img src="${escapeHtml(src)}" alt="" style="width:100%;max-width:320px;height:140px;object-fit:cover;border-radius:8px;margin:0 0 8px" />`
        : "";
      return `<div style="margin:16px 0;padding:12px 0;border-top:1px solid #eee">
        ${image}
        <p style="margin:0 0 4px;color:#D99B15;font-size:12px;font-weight:bold;letter-spacing:1px">JOUR ${day.day}</p>
        ${day.title ? `<p style="margin:0 0 6px;font-weight:bold">${escapeHtml(day.title)}</p>` : ""}
        ${day.description ? `<p style="margin:0;color:#555;font-size:14px;line-height:1.5">${escapeHtml(day.description)}</p>` : ""}
      </div>`;
    })
    .join("");
  return `
    <h2 style="font-size:18px;margin:28px 0 8px">Programme du séjour</h2>
    ${destination.location ? `<p style="color:#555;line-height:1.5">${escapeHtml(destination.location)}</p>` : ""}
    ${dayBlocks}
  `;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.voyagezmdtours.com").replace(
    /\/$/,
    ""
  );
}

function formatDeparture(value?: string) {
  if (!value) return "à confirmer";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function reservationStatusText(status: ReservationStatus) {
  return reservationStatusLabel[status] ?? status;
}

function reservationSummaryLines(reservation: Reservation, destination?: Destination) {
  const dossierUrl = `${siteUrl()}/reservations/${reservation.id}`;
  return [
    `Référence : ${reservation.reference}`,
    `Statut : ${reservationStatusText(reservation.status)}`,
    `Voyage : ${reservation.destinationTitle}`,
    reservation.country ? `Pays : ${reservation.country}` : "",
    reservation.duration ? `Durée : ${reservation.duration}` : "",
    `Date de départ : ${formatDeparture(reservation.departureDate)}`,
    `Voyageurs : ${reservation.travelers}`,
    `Prix unitaire : ${formatPrice(reservation.unitPrice)} FCFA`,
    `Montant total : ${formatPrice(reservation.totalPrice)} FCFA`,
    reservation.phone ? `Téléphone : ${reservation.phone}` : "",
    reservation.email ? `Email : ${reservation.email}` : "",
    reservation.notes ? `Note : ${reservation.notes}` : "",
    destination?.location ? `Programme : ${destination.location}` : "",
    "",
    `Voir votre dossier : ${dossierUrl}`,
  ].filter((line, index, lines) => line !== "" || lines[index + 1] !== "");
}

function reservationSummaryHtml(reservation: Reservation, destination?: Destination) {
  const dossierUrl = `${siteUrl()}/reservations/${reservation.id}`;
  const rows: [string, string][] = [
    ["Référence", reservation.reference],
    ["Statut", reservationStatusText(reservation.status)],
    ["Voyage", reservation.destinationTitle],
    ["Pays", reservation.country],
    ["Durée", reservation.duration],
    ["Date de départ", formatDeparture(reservation.departureDate)],
    ["Voyageurs", String(reservation.travelers)],
    ["Prix unitaire", `${formatPrice(reservation.unitPrice)} FCFA`],
    ["Montant total", `${formatPrice(reservation.totalPrice)} FCFA`],
    ["Téléphone", reservation.phone],
    ["Email", reservation.email],
    ["Note", reservation.notes],
  ];
  if (destination?.location) {
    rows.push(["Lieu / programme", destination.location]);
  }

  const table = rows
    .filter(([, value]) => Boolean(value?.trim?.() ?? value))
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#666;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0">${table}</table>
    <p style="margin:24px 0">
      <a href="${escapeHtml(dossierUrl)}" style="display:inline-block;background:#D99B15;color:#fff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px">
        Voir mon dossier
      </a>
    </p>
  `;
}

const statusEmailCopy: Record<
  ReservationStatus,
  { subject: string; title: string; intro: string }
> = {
  awaiting_contact: {
    subject: "Mise à jour de votre réservation",
    title: "Votre dossier a été mis à jour",
    intro:
      "Le statut de votre réservation a changé. Un conseiller MD Tours vous recontacte pour la suite.",
  },
  payment_received: {
    subject: "Paiement confirmé",
    title: "Votre paiement est confirmé",
    intro:
      "Nous avons bien reçu votre paiement. Voici le récapitulatif de votre réservation. Nous vous recontactons pour les derniers détails pratiques.",
  },
  confirmed: {
    subject: "Voyage confirmé",
    title: "Votre voyage est confirmé",
    intro:
      "Votre rendez-vous et votre voyage sont confirmés. Conservez ce récapitulatif : il reprend toutes les informations de votre dossier.",
  },
  cancelled: {
    subject: "Réservation annulée",
    title: "Votre réservation a été annulée",
    intro:
      "Votre dossier a été annulé. Si cela ne correspond pas à votre demande, contactez-nous rapidement.",
  },
};

function fromAddress() {
  const user = process.env.SMTP_USER?.trim();
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured) return configured;
  if (user?.includes("@")) return `MD Tours <${user}>`;
  return "MD Tours <mdcontact@voyagezmdtours.com>";
}

function agencyInbox() {
  return (
    process.env.CONTACT_INBOX?.trim() ||
    agencyContact.email ||
    "mdcontact@voyagezmdtours.com"
  );
}

export async function sendContactMessageEmail(options: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const inbox = agencyInbox();
  const text = [
    "Nouveau message depuis le site MD Tours.",
    "",
    `Nom : ${options.name}`,
    `Email : ${options.email}`,
    options.phone ? `Téléphone : ${options.phone}` : "",
    "",
    options.message,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Nouveau message du site</h1>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666">Nom</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(options.name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(options.email)}</td></tr>
        ${
          options.phone
            ? `<tr><td style="padding:8px 0;color:#666">Téléphone</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(options.phone)}</td></tr>`
            : ""
        }
      </table>
      <p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(options.message)}</p>
      <p style="font-size:13px;color:#666">Répondez directement à cet email pour écrire à ${escapeHtml(options.email)}.</p>
    </div>
  `;

  await sendMail({
    from: fromAddress(),
    to: inbox,
    replyTo: options.email,
    subject: `Message du site — ${options.name}`,
    text,
    html,
  });
}

export async function sendTripInquiryEmail(
  reservation: Reservation,
  destination: Destination
) {
  const from = fromAddress();
  const program = itineraryText(destination);
  const text = [
    `Bonjour ${reservation.name},`,
    "",
    "MD Tours a bien reçu votre demande de réservation.",
    "",
    `Référence : ${reservation.reference}`,
    `Voyage : ${reservation.destinationTitle}`,
    `Voyageurs : ${reservation.travelers}`,
    `Montant estimé : ${formatPrice(reservation.totalPrice)} FCFA`,
    program,
    "",
    "Un conseiller vous contacte pour confirmer le séjour et le paiement.",
    "",
    `MD Tours — ${agencyContact.email} — ${agencyContact.phone}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Votre demande de voyage</h1>
      <p>Bonjour ${escapeHtml(reservation.name)},</p>
      <p>Nous avons bien reçu votre demande de réservation. Voici le séjour concerné.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666">Référence</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(reservation.reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Voyage</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(reservation.destinationTitle)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Voyageurs</td><td style="padding:8px 0;font-weight:bold">${reservation.travelers}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Montant estimé</td><td style="padding:8px 0;font-weight:bold">${formatPrice(reservation.totalPrice)} FCFA</td></tr>
      </table>
      ${itineraryHtml(destination)}
      <p>Un conseiller MD Tours vous contacte pour confirmer le séjour et le paiement.</p>
      <p style="font-size:13px;color:#666">MD Tours<br>${agencyContact.email}<br>${agencyContact.phone}</p>
    </div>
  `;

  await sendMail({
    from,
    to: reservation.email,
    cc: agencyInbox(),
    subject: `Votre voyage MD Tours — ${reservation.reference}`,
    text,
    html,
  });
}

export async function sendReservationStatusEmail(
  reservation: Reservation,
  destination?: Destination
) {
  const copy = statusEmailCopy[reservation.status] ?? statusEmailCopy.awaiting_contact;
  const from = fromAddress();
  const summary = reservationSummaryLines(reservation, destination);

  const text = [
    `Bonjour ${reservation.name},`,
    "",
    copy.intro,
    "",
    ...summary,
    itineraryText(destination),
    "",
    `MD Tours — ${agencyContact.email} — ${agencyContact.phone}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">${escapeHtml(copy.title)}</h1>
      <p>Bonjour ${escapeHtml(reservation.name)},</p>
      <p>${escapeHtml(copy.intro)}</p>
      ${reservationSummaryHtml(reservation, destination)}
      ${itineraryHtml(destination)}
      <p style="font-size:13px;color:#666">MD Tours<br>${escapeHtml(agencyContact.email)}<br>${escapeHtml(agencyContact.phone)}</p>
    </div>
  `;

  await sendMail({
    from,
    to: reservation.email,
    cc: agencyInbox(),
    subject: `${copy.subject} — ${reservation.reference}`,
    text,
    html,
  });
}

export async function sendTripConfirmationEmail(
  reservation: Reservation,
  destination?: Destination
) {
  await sendReservationStatusEmail(reservation, destination);
}

export async function sendCustomTripQuoteEmail(trip: CustomTripRequest) {
  const from = fromAddress();
  const departure = new Date(`${trip.departureDate}T00:00:00`).toLocaleDateString("fr-FR");
  const back = new Date(`${trip.returnDate}T00:00:00`).toLocaleDateString("fr-FR");
  const lines = (trip.quote?.breakdown ?? [])
    .map((line) => `• ${line.label} : ${formatPrice(line.amount)} FCFA`)
    .join("\n");

  const text = [
    `Bonjour ${trip.name},`,
    "",
    "Voici le devis de votre voyage personnalisé MD Tours.",
    "",
    `Référence : ${trip.reference}`,
    `Destination : ${trip.destination}`,
    `Dates : ${departure} → ${back}`,
    `Voyageurs : ${trip.adults} adulte(s), ${trip.childrenUnder12} enfant(s) -12 ans, ${trip.childrenUnder16} enfant(s) -16 ans`,
    "",
    lines,
    "",
    `Total estimé : ${formatPrice(trip.quote?.total ?? 0)} FCFA`,
    "",
    "Vous pouvez aussi retrouver ce devis dans votre espace client.",
    "",
    `MD Tours — ${agencyContact.email} — ${agencyContact.phone}`,
  ].join("\n");

  const htmlLines = (trip.quote?.breakdown ?? [])
    .map(
      (line) =>
        `<tr><td style="padding:6px 0;color:#666">${line.label}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${formatPrice(line.amount)} FCFA</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Votre devis personnalisé</h1>
      <p>Bonjour ${trip.name},</p>
      <p>Voici le montant estimé de votre voyage, calculé selon vos choix.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666">Référence</td><td style="padding:8px 0;text-align:right;font-weight:bold">${trip.reference}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Destination</td><td style="padding:8px 0;text-align:right;font-weight:bold">${trip.destination}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Dates</td><td style="padding:8px 0;text-align:right;font-weight:bold">${departure} → ${back}</td></tr>
        ${htmlLines}
        <tr><td style="padding:12px 0 0;font-weight:bold">Total estimé</td><td style="padding:12px 0 0;text-align:right;font-weight:bold;color:#D99B15">${formatPrice(trip.quote?.total ?? 0)} FCFA</td></tr>
      </table>
      <p style="font-size:13px;color:#666">MD Tours confirmera ce devis avant le paiement.</p>
      <p style="font-size:13px;color:#666">MD Tours<br>${agencyContact.email}<br>${agencyContact.phone}</p>
    </div>
  `;

  await sendMail({
    from,
    to: trip.email,
    cc: agencyInbox(),
    subject: `Votre devis MD Tours — ${trip.reference}`,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character] ?? character;
  });
}

export async function sendPasswordResetEmail(options: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const from = fromAddress();
  const safeName = escapeHtml(options.name);
  const text = [
    `Bonjour ${options.name},`,
    "",
    "Vous avez demandé à réinitialiser le mot de passe de votre compte MD Tours.",
    "",
    "Ouvrez ce lien pour choisir un nouveau mot de passe (valable 1 heure) :",
    options.resetUrl,
    "",
    "Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.",
    "",
    `MD Tours — ${agencyContact.email} — ${agencyContact.phone}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Réinitialiser votre mot de passe</h1>
      <p>Bonjour ${safeName},</p>
      <p>Vous avez demandé à réinitialiser le mot de passe de votre compte MD Tours.</p>
      <p style="margin:24px 0">
        <a href="${options.resetUrl}" style="display:inline-block;background:#D99B15;color:#fff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px">
          Choisir un nouveau mot de passe
        </a>
      </p>
      <p style="font-size:13px;color:#666">Ce lien expire dans 1 heure. Si le bouton ne fonctionne pas, copiez cette adresse :<br>${escapeHtml(options.resetUrl)}</p>
      <p style="font-size:13px;color:#666">Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
      <p style="font-size:13px;color:#666">MD Tours<br>${agencyContact.email}<br>${agencyContact.phone}</p>
    </div>
  `;

  await sendMail({
    from,
    to: options.to,
    subject: "Réinitialiser votre mot de passe MD Tours",
    text,
    html,
  });
}
