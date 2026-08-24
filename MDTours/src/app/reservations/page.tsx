"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice, reservationStatusLabel } from "@/data/home";
import { formatAdminDate } from "@/lib/csv";
import type { Reservation } from "@/lib/types";

export default function ReservationsPage() {
  const { user, loading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/reservations")
      .then((response) => response.json())
      .then((data: { reservations?: Reservation[] }) => {
        setReservations(data.reservations ?? []);
      })
      .catch(() => setReservations([]));
  }, [user]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Mes réservations</h1>
        {!loading && !user && (
          <p className="mt-4 text-sm text-gray-600">
            <a href="/connexion?next=/reservations" className="font-semibold text-gold">
              Connectez-vous
            </a>{" "}
            pour voir vos voyages.
          </p>
        )}
        {user && reservations.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">Aucune réservation pour le moment.</p>
        )}
        <div className="mt-8 space-y-4">
          {reservations.map((item) => (
            <a
              key={item.id}
              href={`/reservations/${item.id}`}
              className="block rounded-2xl bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gold">
                    {item.reference}
                  </p>
                  <h2 className="mt-1 font-semibold text-navy">{item.destinationTitle}</h2>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.totalPrice)} FCFA ·{" "}
                    {item.departureDate
                      ? formatAdminDate(item.departureDate)
                      : "Départ à confirmer"}
                  </p>
                </div>
                <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                  {reservationStatusLabel[item.status]}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
