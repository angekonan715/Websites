import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Clock, Star, Users } from "lucide-react";
import Header from "@/components/Header";
import BookingForm from "@/components/BookingForm";
import PlacesBadge from "@/components/PlacesBadge";
import TripPrice from "@/components/TripPrice";
import { agencyContact } from "@/data/home";
import { getDestinations } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function VoyagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const destinations = await getDestinations();
  const destination = destinations.find((item) => item.id === id);
  if (!destination) notFound();
  const gallery = destination.gallery ?? [];
  const itinerary = [...(destination.itinerary ?? [])].sort((a, b) => a.day - b.day);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <article>
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-navy sm:aspect-[16/10] sm:rounded-2xl">
            {destination.video ? (
              <video
                controls
                playsInline
                poster={destination.image}
                className="h-full w-full object-cover"
              >
                <source src={destination.video} />
              </video>
            ) : (
              <Image
                src={destination.image}
                alt={destination.title}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          {gallery.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
              {gallery.map((photo) => (
                <div key={photo} className="relative aspect-[4/3] overflow-hidden rounded-lg sm:aspect-square sm:rounded-xl">
                  <Image src={photo} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            {destination.country}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-4xl">
            {destination.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {destination.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-gold text-gold" />
              {destination.rating.toLocaleString("fr-FR", {
                minimumFractionDigits: 1,
              })}{" "}
              ({destination.reviews})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gold" />
              <PlacesBadge dest={destination} variant="light" />
            </span>
          </div>
          <p className="mt-4 text-2xl">
            <TripPrice dest={destination} />
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
            {destination.description ||
              "Réservez ce séjour. Après validation, MD Tours vous contacte pour convenir du paiement de façon sécurisée, puis confirme votre rendez-vous."}
          </p>

          {(destination.location || itinerary.length > 0) && (
            <section className="mt-10 border-t border-gray-100 pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                Programme
              </p>
              <h2 className="mt-2 font-editorial text-2xl font-semibold text-navy sm:text-3xl">
                Le déroulé du séjour
              </h2>
              {destination.location ? (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
                  {destination.location}
                </p>
              ) : null}
              {itinerary.length > 0 ? (
                <ol className="mt-6 space-y-6">
                  {itinerary.map((day) => (
                    <li
                      key={day.id}
                      className="overflow-hidden rounded-xl bg-white shadow-card sm:grid sm:grid-cols-[11rem_minmax(0,1fr)]"
                    >
                      {day.image ? (
                        <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-[8.5rem]">
                          <Image
                            src={day.image}
                            alt={day.title || `Jour ${day.day}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 11rem"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center bg-cream px-4 py-4 sm:px-5">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                            Jour {day.day}
                          </span>
                        </div>
                      )}
                      <div className="p-4 sm:p-5">
                        {day.image ? (
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                            Jour {day.day}
                          </p>
                        ) : null}
                        {day.title ? (
                          <h3 className="mt-1 font-semibold text-navy">{day.title}</h3>
                        ) : null}
                        {day.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            {day.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
              <p className="mt-6 text-sm text-gray-500">
                Une question sur ce programme ?{" "}
                <a href={`mailto:${agencyContact.email}`} className="font-semibold text-gold">
                  {agencyContact.email}
                </a>
              </p>
            </section>
          )}
        </article>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
          <BookingForm destination={destination} />
        </Suspense>
      </div>
    </main>
  );
}
