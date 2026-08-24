"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { normalizeShareSlug } from "@/lib/shareLinks";
import type { Destination, ShareLink, ShareLinkSource } from "@/lib/types";

const sources: { id: ShareLinkSource; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "other", label: "Autre" },
];

function siteOrigin() {
  if (typeof window === "undefined") return "https://www.voyagezmdtours.com";
  return window.location.origin;
}

export default function AdminShareLinks() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [target, setTarget] = useState("/voyages");
  const [source, setSource] = useState<ShareLinkSource>("instagram");
  const [showOnBio, setShowOnBio] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");

  const origin = siteOrigin();
  const bioUrl = `${origin}/liens`;

  async function load() {
    const [linksRes, destRes] = await Promise.all([
      fetch("/api/share-links"),
      fetch("/api/destinations"),
    ]);
    const linksData = (await linksRes.json()) as { links?: ShareLink[] };
    const destData = (await destRes.json()) as { destinations?: Destination[] };
    setLinks(linksData.links ?? []);
    setDestinations(destData.destinations ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  const presets = useMemo(
    () => [
      { value: "/", label: "Accueil" },
      { value: "/voyages", label: "Tous les voyages" },
      { value: "/voyages/groupes", label: "Voyages de groupe" },
      { value: "/voyage-personnalise", label: "Voyage personnalisé" },
      { value: "/a-propos", label: "À propos" },
      { value: "/contact", label: "Contact" },
      ...destinations.map((item) => ({
        value: `/voyages/${item.id}`,
        label: item.title,
      })),
    ],
    [destinations]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, target, source, showOnBio }),
      });
      const data = (await response.json()) as { error?: string; link?: ShareLink };
      if (!response.ok) {
        setError(data.error ?? "Création impossible.");
        return;
      }
      if (data.link) {
        const url = `${origin}/go/${data.link.slug}`;
        await navigator.clipboard.writeText(url);
        setCopied(data.link.id);
        setNotice(`Lien copié : ${url}`);
      }
      setTitle("");
      setSlug("");
      setSlugEdited(false);
      await load();
    } catch {
      setError("Création impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function copyText(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setNotice(`Lien copié : ${value}`);
  }

  async function toggle(item: ShareLink, field: "active" | "showOnBio") {
    await fetch("/api/share-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, [field]: !item[field] }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce lien ?")) return;
    await fetch(`/api/share-links?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <section>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm text-gray-500">
          Sur Instagram, le lien dans le texte d’un post n’est souvent pas cliquable.
          Mettez <strong>{bioUrl.replace(/^https?:\/\//, "")}</strong> dans la bio, ou
          un lien court dans une story / un commentaire TikTok.
        </p>
        <button
          type="button"
          onClick={() => void copyText("bio", bioUrl)}
          className="btn-gold mt-4 px-4 py-2 text-xs"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied === "bio" ? "Lien bio copié" : "Copier le lien bio"}
        </button>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-5 grid gap-3 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-navy">
          Nom du post
          <input
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugEdited) setSlug(normalizeShareSlug(e.target.value));
            }}
            placeholder="Promo Accra Instagram"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Lien court
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(normalizeShareSlug(e.target.value));
            }}
            placeholder="accra-ig"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
          <span className="mt-1 block text-xs font-normal text-gray-500">
            {origin}/go/{slug || "votre-lien"}
          </span>
        </label>
        <label className="text-sm font-medium text-navy">
          Page d’arrivée
          <select
            value={presets.some((item) => item.value === target) ? target : "__custom"}
            onChange={(e) => {
              setTarget(e.target.value === "__custom" ? "" : e.target.value);
            }}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            {presets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
            <option value="__custom">Autre adresse…</option>
          </select>
        </label>
        <label className="text-sm font-medium text-navy">
          Réseau
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as ShareLinkSource)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            {sources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {!presets.some((item) => item.value === target) ? (
          <label className="text-sm font-medium text-navy sm:col-span-2">
            Adresse
            <input
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="/voyages/accra"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-navy sm:col-span-2">
          <input
            type="checkbox"
            checked={showOnBio}
            onChange={(e) => setShowOnBio(e.target.checked)}
          />
          Afficher aussi sur la page bio /liens
        </label>
        {error ? <p className="text-sm text-red-700 sm:col-span-2">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700 sm:col-span-2">{notice}</p> : null}
        <button type="submit" disabled={saving} className="btn-gold w-fit">
          {saving ? "Création..." : "Générer et copier le lien"}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {links.map((item) => {
          const url = `${origin}/go/${item.slug}`;
          return (
            <article
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card"
            >
              <div>
                <p className="text-sm font-semibold text-navy">{item.title}</p>
                <p className="mt-1 text-xs text-gold">{url.replace(/^https?:\/\//, "")}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Vers {item.target} · {item.source} · {item.clicks} clic
                  {item.clicks > 1 ? "s" : ""}
                  {item.active ? "" : " · Pause"}
                  {item.showOnBio ? " · Sur la bio" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyText(item.id, url)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied === item.id ? "Copié" : "Copier"}
                </button>
                <button
                  type="button"
                  onClick={() => void toggle(item, "active")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy"
                >
                  {item.active ? "Pause" : "Activer"}
                </button>
                <button
                  type="button"
                  onClick={() => void toggle(item, "showOnBio")}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy"
                >
                  {item.showOnBio ? "Retirer de la bio" : "Mettre en bio"}
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
          );
        })}
      </div>
    </section>
  );
}
