"use client";

import { useEffect, useState } from "react";
import { formatPrice, reservationStatusLabel } from "@/data/home";
import type { Reservation, ReservationStatus } from "@/lib/types";

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch("/api/reservations");
    const data = (await response.json()) as { reservations?: Reservation[] };
    setReservations(data.reservations ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(id: string, status: ReservationStatus) {
    setError("");
    setNotice("");
    const response = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as {
      error?: string;
      emailSent?: boolean;
      emailError?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Mise à jour impossible.");
      return;
    }
    if (status === "payment_received") {
      if (data.emailSent) {
        setNotice("Paiement confirmé. Un email de confirmation a été envoyé au client.");
      } else {
        setError(
          data.emailError ||
            "Paiement confirmé, mais l’email n’a pas pu être envoyé. Vérifiez SMTP dans .env.local."
        );
      }
    }
    await load();
  }

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-navy">Réservations et paiements</h2>
      <p className="mt-1 text-sm text-gray-500">
        Contactez le client avec sa référence, confirmez le paiement, puis le
        rendez-vous. Confirmer le paiement retire les places du voyage.
      </p>
      {notice && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {reservations.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Aucune réservation.</p>
      )}
      <div className="mt-4 space-y-4">
        {reservations.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gold">
                  {item.reference}
                </p>
                <h3 className="mt-1 font-semibold text-navy">
                  {item.destinationTitle}
                </h3>
                <p className="text-sm text-gray-500">
                  {item.name} · {item.phone} · {item.email}
                </p>
                <p className="text-sm text-gray-500">
                  {item.travelers} voyageur{item.travelers > 1 ? "s" : ""} · Départ{" "}
                  {new Date(`${item.departureDate}T00:00:00`).toLocaleDateString(
                    "fr-FR"
                  )}{" "}
                  · {formatPrice(item.totalPrice)} FCFA
                </p>
                {item.confirmationEmailSentAt && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Email de confirmation envoyé
                  </p>
                )}
              </div>
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                {reservationStatusLabel[item.status]}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === "awaiting_contact" && (
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "payment_received")}
                  className="btn-gold px-4 py-2 text-xs"
                >
                  Confirmer le paiement
                </button>
              )}
              {item.status === "payment_received" && (
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "confirmed")}
                  className="btn-gold px-4 py-2 text-xs"
                >
                  Confirmer le rendez-vous
                </button>
              )}
              {item.status !== "cancelled" && item.status !== "confirmed" && (
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "cancelled")}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-navy hover:border-red-300 hover:text-red-600"
                >
                  Annuler
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
