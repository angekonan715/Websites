"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";

export default function NewTestimonialForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("invite") ?? "";
  const { user, loading } = useAuth();
  const [tripTitle, setTripTitle] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!token) {
      setInviteError("Ce lien d’invitation est manquant.");
      return;
    }
    fetch(`/api/invites/check?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data: { valid?: boolean; reason?: string }) => {
        setValid(Boolean(data.valid));
        setInviteError(data.valid ? "" : data.reason ?? "Lien invalide.");
      })
      .catch(() => setInviteError("Impossible de vérifier le lien."));
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tripTitle, rating, message }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      router.push("/temoignages/merci");
    } catch {
      setError("Envoi impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-xl px-4 py-14">
        <h1 className="text-3xl font-bold text-navy">Partager votre témoignage</h1>
        <p className="mt-2 text-sm text-gray-500">
          Connectez-vous, puis racontez votre voyage. L’avis est lu par MD Tours
          avant publication.
        </p>

        {!loading && !user && (
          <p className="mt-6 rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
            <a
              href={`/connexion?next=${encodeURIComponent(`/temoignages/nouveau?invite=${token}`)}`}
              className="font-semibold text-gold"
            >
              Connectez-vous
            </a>{" "}
            pour témoigner.
          </p>
        )}

        {inviteError && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {inviteError}
          </p>
        )}

        {user && valid && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl bg-white p-6 shadow-search">
            <label className="block text-sm font-medium text-navy">
              Voyage effectué
              <input
                required
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
                placeholder="Accra City Escape"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Note
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Votre témoignage
              <textarea
                required
                minLength={20}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={saving} className="btn-gold w-full">
              {saving ? "Envoi..." : "Envoyer mon témoignage"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
