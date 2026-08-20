import nodemailer from "nodemailer";
import { agencyContact, formatPrice } from "@/data/home";
import type { CustomTripRequest, Reservation } from "@/lib/types";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendTripConfirmationEmail(reservation: Reservation) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error(
      "Email non envoyé : configurez SMTP_HOST, SMTP_USER et SMTP_PASS dans .env.local."
    );
  }

  const departure = reservation.departureDate
    ? new Date(`${reservation.departureDate}T00:00:00`).toLocaleDateString("fr-FR")
    : "à confirmer";
  const from =
    process.env.EMAIL_FROM ||
    `MD Tours <${process.env.SMTP_USER}>`;

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
    "",
    "Nous vous recontactons pour les derniers détails pratiques.",
    "",
    `MD Tours — ${agencyContact.email} — ${agencyContact.phone}`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1A1A2E">
      <p style="color:#D99B15;font-weight:bold;letter-spacing:2px;font-size:12px">MD TOURS</p>
      <h1 style="font-size:22px;margin:8px 0 16px">Votre voyage est confirmé</h1>
      <p>Bonjour ${reservation.name},</p>
      <p>Nous avons bien reçu votre paiement. <strong>Votre voyage est confirmé.</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#666">Référence</td><td style="padding:8px 0;font-weight:bold">${reservation.reference}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Voyage</td><td style="padding:8px 0;font-weight:bold">${reservation.destinationTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Départ</td><td style="padding:8px 0;font-weight:bold">${departure}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Voyageurs</td><td style="padding:8px 0;font-weight:bold">${reservation.travelers}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Montant</td><td style="padding:8px 0;font-weight:bold">${formatPrice(reservation.totalPrice)} FCFA</td></tr>
      </table>
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

  const from =
    process.env.EMAIL_FROM || `MD Tours <${process.env.SMTP_USER}>`;
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
    subject: `Votre devis MD Tours — ${trip.reference}`,
    text,
    html,
  });
}
