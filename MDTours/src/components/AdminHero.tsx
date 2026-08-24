"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import type { Destination, HeroSettings, HistoryTrip } from "@/lib/types";

export default function AdminHero() {
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [trips, setTrips] = useState<Destination[]>([]);
  const [history, setHistory] = useState<HistoryTrip[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [heroRes, tripRes, historyRes] = await Promise.all([
      fetch("/api/hero"),
      fetch("/api/destinations"),
      fetch("/api/history"),
    ]);
    const heroData = (await heroRes.json()) as { hero?: HeroSettings };
    const tripData = (await tripRes.json()) as { destinations?: Destination[] };
    const historyData = (await historyRes.json()) as { trips?: HistoryTrip[] };
    if (heroData.hero) {
      setHero(heroData.hero);
      setAlt(heroData.hero.alt);
    }
    setTrips(tripData.destinations ?? []);
    setHistory(historyData.trips ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(formData: FormData) {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/hero", { method: "PUT", body: formData });
      const data = (await response.json()) as { error?: string; hero?: HeroSettings };
      if (!response.ok || !data.hero) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      setHero(data.hero);
      setAlt(data.hero.alt);
      setImage(null);
      setVideo(null);
      setNotice("Le fond de la page d’accueil a été mis à jour.");
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("alt", alt);
    if (image) formData.set("image", image);
    if (video) formData.set("video", video);
    await submit(formData);
  }

  async function useTrip(options: {
    image: string;
    video?: string;
    label: string;
  }) {
    const formData = new FormData();
    formData.set("alt", options.label);
    formData.set("sourceLabel", options.label);
    formData.set("sourceImage", options.image);
    if (options.video) formData.set("sourceVideo", options.video);
    else formData.set("clearVideo", "1");
    await submit(formData);
  }

  async function clearVideo() {
    const formData = new FormData();
    formData.set("alt", alt);
    formData.set("clearVideo", "1");
    if (hero?.sourceLabel) formData.set("sourceLabel", hero.sourceLabel);
    await submit(formData);
  }

  const recentHistory = history.slice(0, 8);
  const videoTrips = trips.filter((trip) => trip.video);

  return (
    <section className="space-y-6">
      <p className="text-sm text-gray-500">
        Photo et vidéo sont recadrées en 1920×1080 (16:9) pour remplir le bandeau
        de la page d’accueil, sur ordinateur comme sur téléphone.
      </p>

      {hero ? (
        <div className="overflow-hidden rounded-2xl bg-navy shadow-card">
          <div className="relative aspect-[16/9]">
            {hero.video ? (
              <video
                key={hero.video}
                autoPlay
                muted
                loop
                playsInline
                poster={hero.image}
                className="absolute inset-0 h-full w-full object-cover object-center"
              >
                <source src={hero.video} />
              </video>
            ) : (
              <Image
                src={hero.image}
                alt={hero.alt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 960px"
              />
            )}
            <div className="absolute inset-0 bg-navy/25" />
          </div>
          <div className="bg-white px-4 py-3 text-sm text-navy">
            {hero.sourceLabel ? (
              <p>
                En ce moment : <strong>{hero.sourceLabel}</strong>
                {hero.video ? " (vidéo)" : " (photo)"}
              </p>
            ) : (
              <p>{hero.video ? "Vidéo personnalisée" : "Photo actuelle"}</p>
            )}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleUpload}
        className="space-y-4 rounded-2xl bg-white p-5 shadow-card"
      >
        <h3 className="font-semibold text-navy">Importer un fond</h3>
        <label className="block text-sm font-medium text-navy">
          Légende / texte alternatif
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Photo (recadrée 16:9)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
          {image ? (
            <span className="mt-1 block text-xs text-gray-500">{image.name}</span>
          ) : null}
        </label>
        <label className="block text-sm font-medium text-navy">
          Vidéo d’un voyage (recadrée 16:9, sans son, 80 Mo max)
          <input
            type="file"
            accept="video/mp4,video/webm"
            onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
          {video ? (
            <span className="mt-1 block text-xs text-gray-500">{video.name}</span>
          ) : null}
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? "Traitement..." : "Enregistrer"}
          </button>
          {hero?.video ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void clearVideo()}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-navy"
            >
              Retirer la vidéo
            </button>
          ) : null}
        </div>
      </form>

      {trips.length > 0 ? (
        <div>
          <h3 className="font-semibold text-navy">Depuis le catalogue</h3>
          <p className="mt-1 text-sm text-gray-500">
            {videoTrips.length > 0
              ? "Choisissez un voyage : la photo est recadrée 16:9, la vidéo aussi si elle existe."
              : "Aucun voyage n’a encore de vidéo. Vous pouvez quand même utiliser une photo du catalogue, ou importer une vidéo plus haut."}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                disabled={saving}
                onClick={() =>
                  void useTrip({
                    image: trip.image,
                    video: trip.video,
                    label: trip.title,
                  })
                }
                className="overflow-hidden rounded-xl bg-white text-left shadow-card"
              >
                <span className="relative block aspect-[16/10]">
                  <Image
                    src={trip.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 300px"
                  />
                </span>
                <span className="block p-3 text-sm font-semibold text-navy">
                  {trip.title}
                  <span className="mt-1 block text-xs font-normal text-gold">
                    {trip.video ? "Photo + vidéo" : "Photo"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {recentHistory.length > 0 ? (
        <div>
          <h3 className="font-semibold text-navy">Souvenirs récents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Utilisez la photo ou la vidéo d’un voyage déjà publié dans Historique.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentHistory.map((trip) => {
              const cover = trip.images[0];
              if (!cover) return null;
              return (
                <button
                  key={trip.id}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void useTrip({
                      image: cover,
                      video: trip.video,
                      label: trip.title,
                    })
                  }
                  className="overflow-hidden rounded-xl bg-white text-left shadow-card"
                >
                  <span className="relative block aspect-[16/10]">
                    <Image src={cover} alt="" fill className="object-cover" />
                  </span>
                  <span className="block p-3 text-sm font-semibold text-navy">
                    {trip.title}
                    {trip.video ? (
                      <span className="mt-1 block text-xs font-normal text-gold">Vidéo</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
