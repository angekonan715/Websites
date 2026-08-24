"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { emptyMegaPlace, emptyMegaRegion } from "@/lib/megaMenus";
import type { Destination, MegaMenuKey, MegaMenuLink, MegaMenuRegion, MegaMenus } from "@/lib/types";

const tabs: { id: MegaMenuKey; label: string }[] = [
  { id: "destinations", label: "Destinations" },
  { id: "voyages", label: "Nos voyages" },
];

export default function AdminMegaMenus() {
  const [key, setKey] = useState<MegaMenuKey>("destinations");
  const [menus, setMenus] = useState<MegaMenus>({ destinations: [], voyages: [] });
  const [trips, setTrips] = useState<Destination[]>([]);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const regions = menus[key];
  const isPlaces = key === "destinations";

  async function load() {
    const [menuRes, tripRes] = await Promise.all([
      fetch("/api/mega-menus"),
      fetch("/api/destinations"),
    ]);
    const menuData = (await menuRes.json()) as { menus?: MegaMenus };
    const tripData = (await tripRes.json()) as { destinations?: Destination[] };
    if (menuData.menus) setMenus(menuData.menus);
    setTrips(tripData.destinations ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  function updateRegions(next: MegaMenuRegion[]) {
    setMenus((current) => ({ ...current, [key]: next }));
  }

  function updateRegion(index: number, patch: Partial<MegaMenuRegion>) {
    updateRegions(
      regions.map((region, i) => (i === index ? { ...region, ...patch } : region))
    );
  }

  function moveRegion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= regions.length) return;
    const next = [...regions];
    [next[index], next[target]] = [next[target], next[index]];
    updateRegions(next);
  }

  function addPlace(index: number) {
    const region = regions[index];
    updateRegion(index, {
      destinations: [...region.destinations, emptyMegaPlace(region.id)],
    });
  }

  function addFreeLink(index: number) {
    const region = regions[index];
    updateRegion(index, {
      destinations: [
        ...region.destinations,
        {
          id: crypto.randomUUID(),
          label: "Nouveau lien",
          href: region.href || "/voyages",
          image: region.image,
        },
      ],
    });
  }

  function addTripLink(index: number, trip: Destination) {
    const region = regions[index];
    updateRegion(index, {
      destinations: [
        ...region.destinations,
        {
          id: trip.id,
          label: trip.title,
          href: `/voyages/${trip.id}`,
          image: trip.image,
        },
      ],
    });
  }

  function updatePlace(regionIndex: number, placeIndex: number, patch: Partial<MegaMenuLink>) {
    const region = regions[regionIndex];
    updateRegion(regionIndex, {
      destinations: region.destinations.map((place, i) =>
        i === placeIndex ? { ...place, ...patch } : place
      ),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("key", key);
      formData.set("regions", JSON.stringify(regions));
      Object.entries(files).forEach(([id, file]) => {
        formData.set(id.startsWith("place-") || id.startsWith("image-") ? id : `image-${id}`, file);
      });
      const response = await fetch("/api/mega-menus", {
        method: "PUT",
        body: formData,
      });
      const data = (await response.json()) as { error?: string; menus?: MegaMenus };
      if (!response.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      if (data.menus) setMenus(data.menus);
      setFiles({});
      setNotice("Enregistré. Le menu et les pages Destinations sont à jour.");
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="text-sm text-gray-500">
        {isPlaces
          ? "Créez des pays ou régions, puis les lieux à l’intérieur : photo, nom et courte description. Ce n’est pas la liste des voyages à réserver."
          : "Voyage groupé liste automatiquement les séjours du catalogue. Voyage personnalisé reste éditable."}
      </p>

      <div className="mt-5 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setKey(tab.id);
              setError("");
              setNotice("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              key === tab.id ? "bg-navy text-white" : "bg-white text-navy shadow-card"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {regions.map((region, index) => (
          <article key={region.id} className="rounded-2xl bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm font-bold text-navy">
                {region.label || (isPlaces ? "Pays / région" : "Rubrique")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveRegion(index, -1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-navy"
                  aria-label="Monter"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRegion(index, 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-navy"
                  aria-label="Descendre"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateRegions(regions.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Retirer
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-navy sm:col-span-2">
                {isPlaces ? "Pays / région" : "Nom"}
                <input
                  required
                  value={region.label}
                  onChange={(e) => updateRegion(index, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              </label>
              {!isPlaces ? (
                <label className="text-sm font-medium text-navy sm:col-span-2">
                  Lien « Explorer »
                  <input
                    required
                    value={region.href}
                    onChange={(e) => updateRegion(index, { href: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
              ) : null}
              <label className="text-sm font-medium text-navy sm:col-span-2">
                {isPlaces ? "Petite description" : "Phrase sous le titre"}
                <textarea
                  rows={isPlaces ? 2 : 1}
                  value={region.tagline}
                  onChange={(e) => updateRegion(index, { tagline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              </label>
              <label className="text-sm font-medium text-navy sm:col-span-2">
                Photo du pays / de la région
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFiles((current) => ({ ...current, [`image-${region.id}`]: file }));
                  }}
                  className="mt-1 block w-full text-sm"
                />
                {region.image ? (
                  <span className="relative mt-2 block h-24 w-40 overflow-hidden rounded-lg">
                    <Image src={region.image} alt="" fill className="object-cover" />
                  </span>
                ) : null}
              </label>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">
                  {isPlaces ? "Lieux de cette région" : "Liens"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isPlaces ? (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const trip = trips.find((item) => item.id === e.target.value);
                        if (trip) addTripLink(index, trip);
                        e.target.value = "";
                      }}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-navy"
                    >
                      <option value="">Ajouter un voyage existant</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      isPlaces ? addPlace(index) : addFreeLink(index)
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isPlaces ? "Ajouter un lieu" : "Lien libre"}
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {region.destinations.map((place, placeIndex) =>
                  isPlaces ? (
                    <div
                      key={place.id}
                      className="grid gap-2 rounded-xl border border-gray-100 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"
                    >
                      <label className="text-xs font-medium text-navy">
                        Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFiles((current) => ({
                                ...current,
                                [`place-${region.id}-${place.id}`]: file,
                              }));
                            }
                          }}
                          className="mt-1 block w-full text-xs"
                        />
                        {place.image ? (
                          <span className="relative mt-2 block h-16 overflow-hidden rounded-md">
                            <Image src={place.image} alt="" fill className="object-cover" />
                          </span>
                        ) : null}
                      </label>
                      <div className="space-y-2">
                        <input
                          required
                          value={place.label}
                          onChange={(e) =>
                            updatePlace(index, placeIndex, { label: e.target.value })
                          }
                          placeholder="Nom du lieu"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                        />
                        <textarea
                          rows={2}
                          value={place.description ?? ""}
                          onChange={(e) =>
                            updatePlace(index, placeIndex, { description: e.target.value })
                          }
                          placeholder="Petite description"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateRegion(index, {
                            destinations: region.destinations.filter((_, i) => i !== placeIndex),
                          })
                        }
                        className="self-start text-xs font-semibold text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <div key={place.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={place.label}
                        onChange={(e) =>
                          updatePlace(index, placeIndex, { label: e.target.value })
                        }
                        placeholder="Nom"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                      />
                      <input
                        value={place.href}
                        onChange={(e) =>
                          updatePlace(index, placeIndex, { href: e.target.value })
                        }
                        placeholder="/voyages/..."
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateRegion(index, {
                            destinations: region.destinations.filter((_, i) => i !== placeIndex),
                          })
                        }
                        className="text-xs font-semibold text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={() => updateRegions([...regions, emptyMegaRegion()])}
          className="inline-flex items-center gap-1 text-sm font-semibold text-navy"
        >
          <Plus className="h-4 w-4" />
          {isPlaces ? "Ajouter un pays / une région" : "Ajouter une rubrique"}
        </button>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}
