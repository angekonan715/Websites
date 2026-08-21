"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice } from "@/data/home";
import type { Destination } from "@/lib/types";

export default function BookingForm({ destination }: { destination: Destination }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [departureDate, setDepartureDate] = useState(searchParams.get("date") ?? "");
  const [travelers, setTravelers] = useState(Number(searchParams.get("voyageurs")) || 1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const total = destination.price * travelers;

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      router.push(`/connexion?next=/voyages/${destination.id}`);
      return;
    }

    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationId: destination.id,
          name,
          phone,
          departureDate,
          travelers,
          notes,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        reservation?: { id: string };
      };
      if (!response.ok || !data.reservation) {
        setError(data.error ?? "Réservation impossible.");
        return;
      }
      router.push(`/reservations/${data.reservation.id}`);
    } catch {
      setError("Impossible d'enregistrer la réservation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      id="reserver"
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-4 shadow-search sm:p-6"
    >
      <h2 className="text-xl font-bold text-navy">Réserver ce voyage</h2>
      <p className="mt-1 text-sm text-gray-500">
        Total estimé : {formatPrice(total)} FCFA pour {travelers}{" "}
        {travelers > 1 ? "voyageurs" : "voyageur"}
      </p>

      {!loading && !user && (
        <p className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
          <a
            href={`/connexion?next=/voyages/${destination.id}`}
            className="font-semibold text-gold"
          >
            Connectez-vous
          </a>{" "}
          ou créez un compte pour finaliser la réservation.
        </p>
      )}

      <div className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-navy">
          Nom complet
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Téléphone (MD Tours vous contactera ici)
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+225 07 00 00 00 00"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Date de départ
          <input
            required
            type="date"
            min={today}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Voyageurs
          <input
            required
            type="number"
            min={1}
            max={20}
            value={travelers}
            onChange={(e) => setTravelers(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Message (optionnel)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving || loading} className="btn-gold mt-5 w-full">
        {saving ? "Enregistrement..." : "Confirmer ma réservation"}
      </button>
    </form>
  );
}
