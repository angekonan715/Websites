"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import PaymentInstructions from "@/components/PaymentInstructions";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice, reservationStatusLabel } from "@/data/home";
import { formatAdminDate } from "@/lib/csv";
import type { Reservation } from "@/lib/types";

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, loading } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || loading) return;
    if (!user) return;
    fetch(`/api/reservations/${id}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          reservation?: Reservation;
          error?: string;
        };
        if (!response.ok) {
          setError(data.error ?? "Réservation introuvable.");
          return;
        }
        setReservation(data.reservation ?? null);
      })
      .catch(() => setError("Impossible de charger la réservation."));
  }, [id, user, loading]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        {loading && <p className="text-sm text-gray-500">Chargement...</p>}
        {!loading && !user && (
          <p className="text-sm text-navy">
            <a href={`/connexion?next=/reservations/${id}`} className="font-semibold text-gold">
              Connectez-vous
            </a>{" "}
            pour voir votre réservation.
          </p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {reservation && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-search">
              <div className="relative aspect-[16/9] sm:aspect-[2/1]">
                <Image
                  src={reservation.image}
                  alt={reservation.destinationTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Référence {reservation.reference}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-navy">
                  {reservation.destinationTitle}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {reservation.travelers}{" "}
                  {reservation.travelers > 1 ? "voyageurs" : "voyageur"} ·{" "}
                  {reservation.departureDate
                    ? `Départ le ${formatAdminDate(reservation.departureDate)}`
                    : "Départ à confirmer"}{" "}
                  · {formatPrice(reservation.totalPrice)} FCFA
                </p>
                <p className="mt-3 inline-flex rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                  {reservationStatusLabel[reservation.status]}
                </p>
              </div>
            </div>
            <PaymentInstructions reservation={reservation} />
            <a href="/reservations" className="text-sm font-semibold text-gold">
              Voir toutes mes réservations
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
