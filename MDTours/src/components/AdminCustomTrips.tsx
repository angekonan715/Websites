"use client";

import { FormEvent, useEffect, useState } from "react";
import { customTripStatusLabel, formatPrice } from "@/data/home";
import {
  accommodationLabels,
  vehicleLabels,
} from "@/lib/personalizedQuote";
import type { CustomTripRequest } from "@/lib/types";

export default function AdminCustomTrips() {
  const [items, setItems] = useState<CustomTripRequest[]>([]);
  const [openId, setOpenId] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDetails, setProposalDetails] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedDuration, setProposedDuration] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/custom-trips");
    const data = (await response.json()) as { requests?: CustomTripRequest[] };
    setItems(data.requests ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function startReply(item: CustomTripRequest) {
    setOpenId(item.id);
    setProposalTitle(item.proposalTitle || `Proposition ${item.travelKindLabel}`);
    setProposalDetails(item.proposalDetails || "");
    setProposedPrice(item.proposedPrice ? String(item.proposedPrice) : "");
    setProposedDuration(item.proposedDuration || "");
    setError("");
  }

  async function sendDetails(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/custom-trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "proposal_sent",
          proposalTitle,
          proposalDetails,
          proposedDuration,
          proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      setOpenId("");
      await load();
    } catch {
      setError("Envoi impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-navy">Voyages personnalisés</h2>
      <p className="mt-1 text-sm text-gray-500">
        Les clients composent un séjour. Le devis calculé s’affiche ici.
      </p>
      {items.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Aucune demande pour le moment.</p>
      )}
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gold">
                  {item.reference}
                </p>
                <h3 className="mt-1 font-semibold text-navy">
                  {item.destination || item.travelKindLabel}
                </h3>
                <p className="text-sm text-gray-500">
                  {item.name} · {item.phone} · {item.email}
                </p>
                <p className="text-sm text-gray-500">
                  {item.adults ?? item.travelers} adulte
                  {(item.adults ?? item.travelers) > 1 ? "s" : ""}
                  {(item.childrenUnder12 ?? 0) > 0
                    ? ` · ${item.childrenUnder12} enfant(s) -12 ans`
                    : ""}
                  {(item.childrenUnder16 ?? 0) > 0
                    ? ` · ${item.childrenUnder16} enfant(s) -16 ans`
                    : ""}
                </p>
                {item.accommodation && item.vehicle && (
                  <p className="text-sm text-gray-500">
                    {accommodationLabels[item.accommodation]} · véhicule{" "}
                    {vehicleLabels[item.vehicle]}
                    {item.departureDate
                      ? ` · ${new Date(`${item.departureDate}T00:00:00`).toLocaleDateString("fr-FR")}`
                      : ""}
                    {item.returnDate
                      ? ` → ${new Date(`${item.returnDate}T00:00:00`).toLocaleDateString("fr-FR")}`
                      : ""}
                  </p>
                )}
                {item.quote?.total ? (
                  <p className="mt-2 text-sm font-semibold text-navy">
                    Devis : {formatPrice(item.quote.total)} FCFA
                  </p>
                ) : item.budget ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Budget {item.budget} FCFA
                  </p>
                ) : null}
                {item.suggestion ? (
                  <p className="mt-2 text-sm text-gray-600">{item.suggestion}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                {customTripStatusLabel[item.status]}
              </span>
            </div>

            {openId === item.id ? (
              <form
                onSubmit={(event) => void sendDetails(event, item.id)}
                className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4"
              >
                <input
                  required
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="Titre de la proposition"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={proposedDuration}
                    onChange={(e) => setProposedDuration(e.target.value)}
                    placeholder="Durée, ex. 6 jours / 5 nuits"
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="Prix FCFA"
                    className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
                <textarea
                  required
                  minLength={20}
                  rows={5}
                  value={proposalDetails}
                  onChange={(e) => setProposalDetails(e.target.value)}
                  placeholder="Itinéraire, hébergements, inclusions…"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
                {error && <p className="text-sm text-red-700">{error}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-gold px-4 py-2 text-xs">
                    {saving ? "Envoi..." : "Envoyer les détails au client"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId("")}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4">
                {item.proposedPrice ? (
                  <p className="text-sm text-gray-500">
                    Proposition : {formatPrice(item.proposedPrice)} FCFA
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => startReply(item)}
                  className="btn-gold mt-2 px-4 py-2 text-xs"
                >
                  {item.status === "proposal_sent"
                    ? "Modifier les détails"
                    : "Envoyer les détails"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
