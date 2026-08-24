"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { Destination } from "@/lib/types";

export default function TripCatalog({ trips }: { trips: Destination[] }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("destination")?.trim().toLowerCase() ?? "";
  const voyageurs = searchParams.get("voyageurs");

  const filtered = query
    ? trips.filter(
        (trip) =>
          trip.title.toLowerCase().includes(query) ||
          trip.country.toLowerCase().includes(query) ||
          trip.id.replace(/-/g, " ").includes(query)
      )
    : trips;
  const results = filtered.length > 0 ? filtered : trips;
  const noMatch = Boolean(query) && filtered.length === 0;

  return (
    <section
      id="voyages"
      className="bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Catalogue</p>
            <h2 className="section-title mt-3">Voyages actuellement proposés</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy/70 sm:text-base">
              Chaque séjour est créé par MD Tours : photos, lieu et programme jour
              par jour. Choisissez un voyage pour en voir le déroulé.
            </p>
            {(query || voyageurs) && (
              <p className="mt-2 text-sm text-navy/55">
                {query ? <span>Recherche : {searchParams.get("destination")}</span> : null}
                {voyageurs ? (
                  <span>
                    {query ? " · " : ""}
                    {voyageurs} {Number(voyageurs) > 1 ? "voyageurs" : "voyageur"}
                  </span>
                ) : null}
              </p>
            )}
          </div>
          <a
            href="/voyages/groupes"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold"
          >
            Explorer tout le catalogue
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {noMatch ? (
          <p className="mt-6 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-navy">
            Aucun voyage exact pour « {searchParams.get("destination")} ». Voici
            nos suggestions — contactez-nous pour un itinéraire sur mesure.
          </p>
        ) : null}

        {trips.length === 0 ? (
          <p className="mt-10 text-sm text-navy/60">
            Aucun voyage n’est publié pour le moment.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {results.map((trip) => (
              <a
                key={trip.id}
                href={`/voyages/${trip.id}`}
                className="group relative min-h-[14rem] overflow-hidden rounded-sm sm:min-h-[18rem]"
              >
                <Image
                  src={trip.image}
                  alt={trip.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                    {trip.country}
                  </p>
                  <h3 className="mt-1 font-editorial text-xl font-semibold text-white sm:text-2xl">
                    {trip.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/75 sm:text-sm">{trip.duration}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
