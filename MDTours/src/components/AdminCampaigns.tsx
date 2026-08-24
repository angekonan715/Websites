"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Campaign } from "@/lib/types";

function localDateTimeValue(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/campaigns");
    const data = (await response.json()) as { campaigns?: Campaign[] };
    setCampaigns(data.campaigns ?? []);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          href,
          active: true,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "",
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Ajout impossible.");
        return;
      }
      setMessage("");
      setHref("");
      setExpiresAt("");
      setNotice("Campagne publiée. Elle disparaîtra automatiquement à la date de fin.");
      await load();
    } catch {
      setError("Ajout impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: Campaign) {
    await fetch("/api/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Retirer cette campagne ?")) return;
    await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <section>
      <p className="text-sm text-gray-500">
        Ces messages défilent en haut du site. À la date de fin, ils sont supprimés automatiquement.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-3 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Message
          <input
            required
            minLength={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Promo été : -15 % sur Accra City Escape jusqu’au 30 septembre"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Lien (optionnel)
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/voyages/accra"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Date de fin
          <input
            required
            type="datetime-local"
            min={localDateTimeValue()}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <span className="mt-1 block text-xs font-normal text-gray-500">
            À cette date et heure, la campagne est retirée du site et de l’admin.
          </span>
        </label>
        {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        {notice && <p className="text-sm text-emerald-700 sm:col-span-2">{notice}</p>}
        <button type="submit" disabled={saving} className="btn-gold w-fit">
          {saving ? "Publication..." : "Lancer la campagne"}
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {campaigns.map((item) => (
          <article
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card"
          >
            <div>
              <p className="text-sm font-semibold text-navy">{item.message}</p>
              {item.href ? (
                <p className="mt-1 text-xs text-gray-500">{item.href}</p>
              ) : null}
              <p className="mt-1 text-xs text-gold">
                {item.active ? "En diffusion" : "Pause"}
                {item.expiresAt ? ` · Fin le ${formatDeadline(item.expiresAt)}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void toggle(item)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy"
              >
                {item.active ? "Mettre en pause" : "Diffuser"}
              </button>
              <button
                type="button"
                onClick={() => void remove(item.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
