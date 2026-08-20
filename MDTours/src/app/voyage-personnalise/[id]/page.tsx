"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { customTripStatusLabel, formatPrice } from "@/data/home";
import {
  accommodationLabels,
  vehicleLabels,
} from "@/lib/personalizedQuote";
import type { CustomTripRequest } from "@/lib/types";

export default function CustomTripDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [item, setItem] = useState<CustomTripRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id || loading || !user) return;
    fetch(`/api/custom-trips/${params.id}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          request?: CustomTripRequest;
          error?: string;
        };
        if (!response.ok) {
          setError(data.error ?? "Demande introuvable.");
          return;
        }
        setItem(data.request ?? null);
      })
      .catch(() => setError("Impossible de charger la demande."));
  }, [params.id, user, loading]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-3xl px-4 py-14">
        {loading && <p className="text-sm text-gray-500">Chargement...</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {item && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-search">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                {item.reference}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-navy">
                Voyage personnalisé
                {item.destination ? ` · ${item.destination}` : ""}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {item.adults ?? item.travelers} adulte
                {(item.adults ?? 0) > 1 ? "s" : ""}
                {(item.childrenUnder12 ?? 0) > 0
                  ? ` · ${item.childrenUnder12} enfant(s) -12 ans`
                  : ""}
                {(item.childrenUnder16 ?? 0) > 0
                  ? ` · ${item.childrenUnder16} enfant(s) -16 ans`
                  : ""}
              </p>
              {item.departureDate && (
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(`${item.departureDate}T00:00:00`).toLocaleDateString("fr-FR")}
                  {item.returnDate
                    ? ` → ${new Date(`${item.returnDate}T00:00:00`).toLocaleDateString("fr-FR")}`
                    : ""}
                  {item.nights ? ` · ${item.nights} nuit${item.nights > 1 ? "s" : ""}` : ""}
                </p>
              )}
              {item.accommodation && item.vehicle && (
                <p className="mt-1 text-sm text-gray-500">
                  {accommodationLabels[item.accommodation]} · véhicule{" "}
                  {vehicleLabels[item.vehicle]}
                </p>
              )}
              <p className="mt-3 inline-flex rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                {customTripStatusLabel[item.status]}
              </p>
              {item.suggestion ? (
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  {item.suggestion}
                </p>
              ) : null}
            </div>

            {item.quote && (
              <div className="rounded-2xl bg-navy p-6 text-white shadow-search">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Devis
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatPrice(item.quote.total)}{" "}
                  <span className="text-base font-medium text-white/70">FCFA</span>
                </p>
                <dl className="mt-5 space-y-2 text-sm text-white/80">
                  {item.quote.breakdown.map((line) => (
                    <div key={line.label} className="flex justify-between gap-4">
                      <dt>{line.label}</dt>
                      <dd className="shrink-0">{formatPrice(line.amount)} FCFA</dd>
                    </div>
                  ))}
                </dl>
                {item.quoteEmailSentAt ? (
                  <p className="mt-4 text-xs text-white/50">
                    Un récapitulatif a aussi été envoyé par e-mail.
                  </p>
                ) : (
                  <p className="mt-4 text-xs text-white/50">
                    MD Tours confirmera ce montant avant le paiement.
                  </p>
                )}
              </div>
            )}

            {item.status === "pending" && (
              <p className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-sm text-navy">
                Votre voyage est enregistré. MD Tours vous recontacte pour
                confirmer les disponibilités et le paiement.
              </p>
            )}

            {item.proposalDetails && (
              <div className="rounded-2xl bg-white p-6 shadow-search">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Message MD Tours
                </p>
                <h2 className="mt-2 text-xl font-bold text-navy">
                  {item.proposalTitle || "Détails de votre séjour"}
                </h2>
                {item.proposedDuration && (
                  <p className="mt-2 text-sm text-gray-500">{item.proposedDuration}</p>
                )}
                {item.proposedPrice ? (
                  <p className="mt-1 text-lg font-bold text-navy">
                    {formatPrice(item.proposedPrice)} FCFA
                  </p>
                ) : null}
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {item.proposalDetails}
                </p>
                <a href="/contact" className="btn-gold mt-6 inline-flex">
                  Contacter MD Tours
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
