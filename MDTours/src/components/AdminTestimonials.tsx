"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import type { Testimonial, TestimonyInvite } from "@/lib/types";

export default function AdminTestimonials() {
  const [invites, setInvites] = useState<TestimonyInvite[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  async function load() {
    const [inviteRes, testimonialRes] = await Promise.all([
      fetch("/api/invites"),
      fetch("/api/testimonials"),
    ]);
    const inviteData = (await inviteRes.json()) as { invites?: TestimonyInvite[] };
    const testimonialData = (await testimonialRes.json()) as {
      testimonials?: Testimonial[];
    };
    setInvites(inviteData.invites ?? []);
    setTestimonials(testimonialData.testimonials ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function generateLink() {
    setError("");
    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const data = (await response.json()) as {
      error?: string;
      invite?: TestimonyInvite;
    };
    if (!response.ok || !data.invite) {
      setError(data.error ?? "Impossible de créer le lien.");
      return;
    }
    const url = `${window.location.origin}/temoignages/nouveau?invite=${data.invite.token}`;
    setLink(url);
    setNote("");
    await load();
  }

  async function copyLink(url: string, token?: string) {
    await navigator.clipboard.writeText(url);
    setLink(url);
    if (token) setCopiedToken(token);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    await fetch("/api/testimonials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-navy">Avis clients</h2>
      <p className="mt-1 text-sm text-gray-500">
        Générez un lien unique. Le client se connecte, témoigne, puis vous
        publiez l’avis.
      </p>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card sm:flex-row">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nom du client (optionnel)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button type="button" onClick={() => void generateLink()} className="btn-gold">
          Générer un lien
        </button>
      </div>
      {link && (
        <div className="mt-3 rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
          <p className="font-semibold">Lien d’avis prêt à envoyer</p>
          <p className="mt-1 break-all">{link}</p>
          <button
            type="button"
            onClick={() => void copyLink(link)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold"
          >
            <Copy className="h-3.5 w-3.5" />
            Copier le lien
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-3">
        {invites.slice(0, 8).map((invite) => {
          const url = `/temoignages/nouveau?invite=${invite.token}`;
          return (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-card"
            >
              <div>
                <p className="font-medium text-navy">{invite.note}</p>
                <p className="text-xs text-gray-500">
                  {invite.usedAt ? "Utilisé" : "En attente"} · expire le{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {!invite.usedAt && (
                <button
                  type="button"
                  onClick={() => void copyLink(`${window.location.origin}${url}`, invite.token)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedToken === invite.token ? "Copié" : "Copier le lien"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="mt-8 font-semibold text-navy">Avis à modérer</h3>
      <div className="mt-3 space-y-3">
        {testimonials
          .filter((item) => item.status === "pending")
          .map((item) => (
            <article key={item.id} className="rounded-xl bg-white p-4 shadow-card">
              <p className="text-sm font-semibold text-navy">
                {item.authorName} · {item.tripTitle} · {item.rating}/5
              </p>
              <p className="mt-2 text-sm text-gray-600">{item.message}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "approved")}
                  className="btn-gold px-4 py-2 text-xs"
                >
                  Publier
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus(item.id, "rejected")}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold"
                >
                  Refuser
                </button>
              </div>
            </article>
          ))}
        {testimonials.filter((item) => item.status === "pending").length === 0 && (
          <p className="text-sm text-gray-500">Aucun avis en attente.</p>
        )}
      </div>
    </section>
  );
}
