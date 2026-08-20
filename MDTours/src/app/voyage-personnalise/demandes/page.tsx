"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { customTripStatusLabel } from "@/data/home";
import type { CustomTripRequest } from "@/lib/types";

export default function CustomTripListPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CustomTripRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/custom-trips")
      .then((response) => response.json())
      .then((data: { requests?: CustomTripRequest[] }) => {
        setItems(data.requests ?? []);
      })
      .catch(() => setItems([]));
  }, [user]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="text-3xl font-bold text-navy">Mes voyages personnalisés</h1>
        {!loading && !user && (
          <p className="mt-4 text-sm text-gray-600">
            <a href="/connexion?next=/voyage-personnalise/demandes" className="font-semibold text-gold">
              Connectez-vous
            </a>
          </p>
        )}
        {user && items.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            Aucune demande.{" "}
            <a href="/voyage-personnalise" className="font-semibold text-gold">
              Créer un voyage personnalisé
            </a>
          </p>
        )}
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <a
              key={item.id}
              href={`/voyage-personnalise/${item.id}`}
              className="block rounded-2xl bg-white p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gold">
                    {item.reference}
                  </p>
                  <h2 className="mt-1 font-semibold text-navy">{item.travelKindLabel}</h2>
                  <p className="text-sm text-gray-500">
                    {item.destination || "Destination à préciser"}
                  </p>
                </div>
                <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                  {customTripStatusLabel[item.status]}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
