import nodemailer from "nodemailer";
import { agencyContact, formatPrice } from "@/data/home";
import type { CustomTripRequest, Destination, Reservation } from "@/lib/types";

function getTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || (host.includes("zoho") ? 465 : 587));
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
  });
}

export function isEmailConfigured() {
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
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email non envoyé : SMTP non configuré.");
  }

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

  await transporter.sendMail({
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
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(
      "Email non envoyé : configurez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env.local."
    );
  }

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

  await transporter.sendMail({
    from,
    to: reservation.email,
    cc: agencyInbox(),
    subject: `Votre voyage MD Tours — ${reservation.reference}`,
    text,
    html,
  });
}

export async function sendTripConfirmationEmail(
  reservation: Reservation,
  destination?: Destination
) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(
      "Email non envoyé : configurez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env.local."
    );
  }

  const departure = reservation.departureDate
    ? new Date(`${reservation.departureDate}T00:00:00`).toLocaleDateString("fr-FR")
    : "à confirmer";
  const from = fromAddress();

  const text = [
    `Bonjour ${reservation.name},`,
    "",
    "MD Tours a bien reçu votre paiement. Votre voyage est confirmé.",
    "",
    `Référence : ${reservation.reference}`,
    `Voyage : ${reservation.destinationTitle}`,
    `Date de départ : ${departure}`,
    `Voyageurs : ${reservation.travelers}`,
    `Montant : ${formatPrice(reservation.totalPrice)} FCFA`,
    itineraryText(destination),
    "",
    "Nous vous recontactons pour les derniers détails pratiques.",
    "",
    `MD Tours — ${agencyContact.email} — ${agencyContact.phone}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Votre voyage est confirmé</h1>
      <p>Bonjour ${escapeHtml(reservation.name)},</p>
      <p>Nous avons bien reçu votre paiement. <strong>Votre voyage est confirmé.</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666">Référence</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(reservation.reference)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Voyage</td><td style="padding:8px 0;font-weight:bold">${escapeHtml(reservation.destinationTitle)}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Départ</td><td style="padding:8px 0;font-weight:bold">${departure}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Voyageurs</td><td style="padding:8px 0;font-weight:bold">${reservation.travelers}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Montant</td><td style="padding:8px 0;font-weight:bold">${formatPrice(reservation.totalPrice)} FCFA</td></tr>
      </table>
      ${itineraryHtml(destination)}
      <p>Nous vous recontactons pour les derniers détails pratiques.</p>
      <p style="font-size:13px;color:#666">MD Tours<br>${agencyContact.email}<br>${agencyContact.phone}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: reservation.email,
    subject: `Votre voyage est confirmé — ${reservation.reference}`,
    text,
    html,
  });
}

export async function sendCustomTripQuoteEmail(trip: CustomTripRequest) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email non envoyé : SMTP non configuré.");
  }

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

  await transporter.sendMail({
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
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email non envoyé : SMTP non configuré.");
  }

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

  await transporter.sendMail({
    from,
    to: options.to,
    subject: "Réinitialiser votre mot de passe MD Tours",
    text,
    html,
  });
}
