"use client";

import { ArrowRight, ArrowUpRight, Clock, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/data/home";
import type { Destination } from "@/lib/types";

export default function Destinations() {
  const searchParams = useSearchParams();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const query = searchParams.get("destination")?.trim().toLowerCase() ?? "";
  const date = searchParams.get("date");
  const voyageurs = searchParams.get("voyageurs");

  useEffect(() => {
    fetch("/api/destinations")
      .then((response) => response.json())
      .then((data: { destinations?: Destination[] }) => {
        setDestinations(data.destinations ?? []);
      })
      .catch(() => setDestinations([]));
  }, []);

  const filtered = query
    ? destinations.filter(
        (dest) =>
          dest.title.toLowerCase().includes(query) ||
          dest.country.toLowerCase().includes(query) ||
          dest.id.replace(/-/g, " ").includes(query)
      )
    : destinations;

  const results = filtered.length > 0 ? filtered : destinations;
  const noMatch = Boolean(query) && filtered.length === 0;

  return (
    <section
      id="voyages"
      className="bg-white px-4 pb-16 pt-12 sm:px-6 lg:px-8"
    >
      <div id="destinations" className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Destinations Populaires
            </p>
            <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
              Où souhaitez-vous partir ?
            </h2>
            {(query || date || voyageurs) && (
              <p className="mt-2 text-sm text-gray-500">
                {query && <span>Recherche : {searchParams.get("destination")}</span>}
                {date && (
                  <span>
                    {query ? " · " : ""}
                    Départ le{" "}
                    {new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR")}
                  </span>
                )}
                {voyageurs && (
                  <span>
                    {query || date ? " · " : ""}
                    {voyageurs}{" "}
                    {Number(voyageurs) > 1 ? "voyageurs" : "voyageur"}
                  </span>
                )}
              </p>
            )}
          </div>
          <a
            href="/voyages/groupes"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition-colors hover:text-gold"
          >
            Voir tous les voyages
            <ArrowUpRight className="h-4 w-4 text-gold" />
          </a>
        </div>

        {noMatch && (
          <p className="mb-6 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-navy">
            Aucun voyage exact pour « {searchParams.get("destination")} ». Voici
            nos suggestions — contactez-nous pour un itinéraire sur mesure.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((dest) => (
            <article
              key={dest.id}
              className="group relative overflow-hidden rounded-2xl shadow-card transition-transform hover:-translate-y-1"
            >
              <a
                href={
                  date || voyageurs
                    ? `/voyages/${dest.id}?${new URLSearchParams({
                        ...(date ? { date } : {}),
                        ...(voyageurs ? { voyageurs } : {}),
                      }).toString()}`
                    : `/voyages/${dest.id}`
                }
                className="block"
              >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={dest.image}
                  alt={dest.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <span className="absolute left-4 top-4 rounded-md bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {dest.country}
                </span>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white">{dest.title}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
                    <Clock className="h-3.5 w-3.5" />
                    {dest.duration}
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">
                    À partir de {formatPrice(dest.price)} FCFA
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star
                        className="h-4 w-4 fill-gold text-gold"
                        strokeWidth={0}
                      />
                      <span className="text-sm font-semibold text-white">
                        {dest.rating.toLocaleString("fr-FR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </span>
                      <span className="text-xs text-white/70">
                        ({dest.reviews})
                      </span>
                    </div>
                    <span
                      aria-label={`Réserver ${dest.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gold transition-colors group-hover:bg-gold group-hover:text-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
