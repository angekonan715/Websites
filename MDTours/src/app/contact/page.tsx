"use client";

import { FormEvent, useState } from "react";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { agencyContact } from "@/data/home";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      setSent(true);
    } catch {
      setError("Envoi impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Contact"
        title="Parlons de votre prochain voyage"
        subtitle="Écrivez-nous : un conseiller MD Tours vous répond."
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm text-gray-600">Téléphone : {agencyContact.phone}</p>
          <p className="text-sm text-gray-600">Email : {agencyContact.email}</p>
          <a
            href={`https://wa.me/${agencyContact.whatsapp}`}
            className="mt-4 inline-flex font-semibold text-gold"
          >
            WhatsApp
          </a>
        </div>
        {sent ? (
          <p className="rounded-2xl bg-emerald-50 p-6 text-sm text-emerald-800">
            Message envoyé. MD Tours vous recontactera bientôt.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-gray-50 p-4 sm:p-6">
            <label className="block text-sm font-medium text-navy">
              Nom
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Téléphone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Message
              <textarea
                required
                minLength={10}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <button type="submit" disabled={saving} className="btn-gold">
              {saving ? "Envoi..." : "Envoyer"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
