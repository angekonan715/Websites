"use client";

import { ArrowRight, ArrowUpRight, Clock, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlacesBadge from "@/components/PlacesBadge";
import TripPrice from "@/components/TripPrice";
import type { Destination } from "@/lib/types";

export default function Destinations() {
  const searchParams = useSearchParams();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const query = searchParams.get("destination")?.trim().toLowerCase() ?? "";
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
      className="bg-cream px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8"
    >
      <div id="destinations" className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Nos voyages</p>
            <h2 className="section-title mt-3">
              Où souhaitez-vous partir ?
            </h2>
            {(query || voyageurs) && (
              <p className="mt-2 text-sm text-gray-500">
                {query && <span>Recherche : {searchParams.get("destination")}</span>}
                {voyageurs && (
                  <span>
                    {query ? " · " : ""}
                    {voyageurs}{" "}
                    {Number(voyageurs) > 1 ? "voyageurs" : "voyageur"}
                  </span>
                )}
              </p>
            )}
          </div>
          <a
            href="/voyages/groupes"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy transition-colors hover:text-gold"
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

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((dest) => (
            <article
              key={dest.id}
              className="group relative overflow-hidden rounded-sm shadow-card transition-transform hover:-translate-y-1"
            >
              <a
                href={
                  voyageurs
                    ? `/voyages/${dest.id}?${new URLSearchParams({ voyageurs }).toString()}`
                    : `/voyages/${dest.id}`
                }
                className="block"
              >
              <div className="relative aspect-[16/10] w-full sm:aspect-[4/3] xl:aspect-[4/5]">
                <Image
                  src={dest.image}
                  alt={dest.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                <span className="absolute left-2.5 top-2.5 rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[10px]">
                  {dest.country}
                </span>
                <PlacesBadge dest={dest} />

                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                  <h3 className="font-editorial text-lg font-semibold leading-snug text-white sm:text-2xl">{dest.title}</h3>
                  <div className="mt-1 hidden items-center gap-1.5 text-xs text-white/80 sm:mt-1.5 sm:flex">
                    <Clock className="h-3.5 w-3.5" />
                    {dest.duration}
                  </div>
                  <p className="mt-1 text-xs sm:mt-2 sm:text-sm">
                    <TripPrice dest={dest} light />
                  </p>
                  <div className="mt-2 flex items-center justify-between sm:mt-3">
                    <div className="flex items-center gap-1">
                      <Star
                        className="h-3.5 w-3.5 fill-gold text-gold sm:h-4 sm:w-4"
                        strokeWidth={0}
                      />
                      <span className="text-xs font-semibold text-white sm:text-sm">
                        {dest.rating.toLocaleString("fr-FR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </span>
                      <span className="hidden text-xs text-white/70 sm:inline">
                        ({dest.reviews})
                      </span>
                    </div>
                    <span
                      aria-label={`Réserver ${dest.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gold transition-colors group-hover:bg-gold group-hover:text-white sm:h-9 sm:w-9"
                    >
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
