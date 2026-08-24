"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { HistoryTrip } from "@/lib/types";

export default function AdminHistory() {
  const [trips, setTrips] = useState<HistoryTrip[]>([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/history");
    const data = (await response.json()) as { trips?: HistoryTrip[] };
    setTrips(data.trips ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("location", location);
      formData.set("date", date);
      formData.set("description", description);
      images.forEach((file) => formData.append("images", file));
      if (video) formData.set("video", video);
      formData.set("imageRights", rightsConfirmed ? "1" : "0");

      const response = await fetch("/api/history", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Ajout impossible.");
        return;
      }
      setTitle("");
      setLocation("");
      setDate("");
      setDescription("");
      setImages([]);
      setVideo(null);
      setRightsConfirmed(false);
      setMessage("Souvenir ajouté à l’historique.");
      await load();
    } catch {
      setError("Ajout impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTrip(id: string) {
    if (!confirm("Supprimer ce souvenir de l’historique ?")) return;
    await fetch(`/api/history?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <section>
      <p className="text-sm text-gray-500">
        Ajoutez photos et vidéos uniquement si les personnes visibles ont
        accepté la publication. Voir{" "}
        <a href="/droits-images" className="font-semibold text-gold">
          droits à l’image
        </a>
        .
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-navy">
          Titre
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Lieu
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            className="mt-1 w-full text-sm"
          />
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Vidéo (optionnel)
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-navy sm:col-span-2">
          <input
            required
            type="checkbox"
            checked={rightsConfirmed}
            onChange={(e) => setRightsConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#D99B15]"
          />
          <span>
            Je confirme que les personnes reconnaissables ont accepté la
            publication de ces photos/vidéos sur le site MD Tours.{" "}
            <a href="/droits-images" className="font-semibold text-gold">
              Droits à l’image
            </a>
          </span>
        </label>
        {error && (
          <p className="sm:col-span-2 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="sm:col-span-2 text-sm text-green-700">{message}</p>
        )}
        <button
          type="submit"
          disabled={saving || !rightsConfirmed}
          className="btn-gold sm:col-span-2 w-fit"
        >
          {saving ? "Envoi..." : "Publier dans l’historique"}
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <article key={trip.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="relative h-36 bg-gray-100">
              {trip.images[0] ? (
                <Image src={trip.images[0]} alt={trip.title} fill className="object-cover" />
              ) : null}
            </div>
            <div className="p-4">
              <p className="font-semibold text-navy">{trip.title}</p>
              <p className="text-xs text-gray-500">
                {trip.location} · {trip.date}
              </p>
              <button
                type="button"
                onClick={() => void removeTrip(trip.id)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600"
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
