"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Pencil, Trash2, Upload, Video } from "lucide-react";
import { formatPrice } from "@/data/home";
import type { Destination } from "@/lib/types";

const emptyForm = {
  title: "",
  country: "GHANA",
  duration: "5 jours / 4 nuits",
  price: "",
  rating: "4.8",
  reviews: "0",
  description: "",
};

export default function AdminTrips() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [copiedId, setCopiedId] = useState("");

  async function loadDestinations() {
    const response = await fetch("/api/destinations");
    const data = (await response.json()) as { destinations: Destination[] };
    setDestinations(data.destinations ?? []);
  }

  useEffect(() => {
    void loadDestinations();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImage(null);
    setVideo(null);
    setGallery([]);
    setRemoveVideo(false);
    setError("");
    setMessage("");
  }

  function startEdit(dest: Destination) {
    setEditingId(dest.id);
    setForm({
      title: dest.title,
      country: dest.country,
      duration: dest.duration,
      price: String(dest.price),
      rating: String(dest.rating),
      reviews: String(dest.reviews),
      description: dest.description ?? "",
    });
    setImage(null);
    setVideo(null);
    setGallery([]);
    setRemoveVideo(false);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("title", form.title);
      formData.set("country", form.country);
      formData.set("duration", form.duration);
      formData.set("price", form.price);
      formData.set("rating", form.rating);
      formData.set("reviews", form.reviews);
      formData.set("description", form.description);
      if (image) formData.set("image", image);
      if (video) formData.set("video", video);
      gallery.forEach((file) => formData.append("gallery", file));
      if (editingId) {
        formData.set("id", editingId);
        if (removeVideo) formData.set("removeVideo", "1");
      }

      const response = await fetch("/api/destinations", {
        method: editingId ? "PATCH" : "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }

      const wasEditing = Boolean(editingId);
      startCreate();
      setMessage(
        wasEditing
          ? "Voyage mis à jour."
          : "Voyage ajouté. Il apparaît maintenant sur le site."
      );
      await loadDestinations();
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function removeDestination(id: string, title: string) {
    if (!confirm(`Retirer « ${title} » du site ?`)) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/destinations?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Suppression impossible.");
        return;
      }
      setMessage(`« ${title} » a été retiré du site.`);
      if (editingId === id) startCreate();
      await loadDestinations();
    } catch {
      setError("Suppression impossible.");
    } finally {
      setDeletingId("");
    }
  }

  async function copyReviewLink(dest: Destination) {
    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: dest.title }),
    });
    const data = (await response.json()) as {
      invite?: { token: string };
      error?: string;
    };
    if (!response.ok || !data.invite) {
      setError(data.error ?? "Impossible de créer le lien d’avis.");
      return;
    }
    const url = `${window.location.origin}/temoignages/nouveau?invite=${data.invite.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(dest.id);
    setMessage(`Lien d’avis copié pour « ${dest.title} ».`);
  }

  const editing = destinations.find((item) => item.id === editingId);

  return (
    <section className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy">
            {editingId ? "Modifier le voyage" : "Ajouter un voyage"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Photo de couverture, photos supplémentaires et vidéo pour le bloc
            voyage.
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-navy"
          >
            Nouveau voyage
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-6 rounded-2xl bg-white p-6 shadow-search lg:grid-cols-2"
      >
        <label className="text-sm font-medium text-navy">
          Titre
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Pays
          <input
            required
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Durée
          <input
            required
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Prix (FCFA)
          <input
            required
            type="number"
            min={1}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Note
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Nombre d’avis
          <input
            type="number"
            min={0}
            value={form.reviews}
            onChange={(e) => setForm({ ...form, reviews: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy lg:col-span-2">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>

        <label className="text-sm font-medium text-navy">
          Photo de couverture {editingId ? "(optionnel)" : ""}
          <span className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 hover:border-gold">
            <Upload className="h-4 w-4 text-gold" />
            {image ? image.name : "JPG, PNG ou WEBP"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required={!editingId}
            className="hidden"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="text-sm font-medium text-navy">
          Vidéo du bloc (optionnel)
          <span className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 hover:border-gold">
            <Video className="h-4 w-4 text-gold" />
            {video ? video.name : "MP4 ou WEBM"}
          </span>
          <input
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              setVideo(e.target.files?.[0] ?? null);
              setRemoveVideo(false);
            }}
          />
          {editing?.video && !removeVideo && (
            <label className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={removeVideo}
                onChange={(e) => setRemoveVideo(e.target.checked)}
              />
              Retirer la vidéo actuelle
            </label>
          )}
        </label>

        <label className="text-sm font-medium text-navy lg:col-span-2">
          Photos supplémentaires
          <span className="mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 hover:border-gold">
            <Upload className="h-4 w-4 text-gold" />
            {gallery.length > 0
              ? `${gallery.length} photo(s) sélectionnée(s)`
              : "Ajoutez plusieurs photos au bloc"}
          </span>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setGallery(Array.from(e.target.files ?? []))}
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 lg:col-span-2">
            {message}
          </p>
        )}

        <button type="submit" disabled={saving} className="btn-gold lg:col-span-2">
          {saving
            ? "Enregistrement..."
            : editingId
              ? "Enregistrer les modifications"
              : "Publier le voyage"}
        </button>
      </form>

      <h3 className="mt-12 text-xl font-bold text-navy">Voyages publiés</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((dest) => (
          <article key={dest.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="relative h-40">
              <Image src={dest.image} alt={dest.title} fill className="object-cover" />
              {dest.video ? (
                <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase text-white">
                  Vidéo
                </span>
              ) : null}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gold">
                {dest.country}
              </p>
              <h3 className="font-semibold text-navy">{dest.title}</h3>
              <p className="text-sm text-gray-500">{formatPrice(dest.price)} FCFA</p>
              {dest.gallery && dest.gallery.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {dest.gallery.length} photo(s) extra
                </p>
              )}
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(dest)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-navy hover:border-gold"
                >
                  <Pencil className="h-4 w-4 text-gold" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void copyReviewLink(dest)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-navy hover:border-gold"
                >
                  <Copy className="h-4 w-4 text-gold" />
                  {copiedId === dest.id ? "Lien d’avis copié" : "Copier le lien d’avis"}
                </button>
                <button
                  type="button"
                  disabled={deletingId === dest.id}
                  onClick={() => void removeDestination(dest.id, dest.title)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === dest.id ? "Suppression..." : "Supprimer du site"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
