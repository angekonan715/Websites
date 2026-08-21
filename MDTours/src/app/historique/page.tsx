import Image from "next/image";
import { Calendar, MapPin, PlayCircle, Star } from "lucide-react";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { getHistoryTrips, getTestimonials } from "@/lib/store";

export default async function HistoriquePage() {
  const trips = (await getHistoryTrips()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const testimonials = (await getTestimonials())
    .filter(
      (item) =>
        item.status === "approved" &&
        item.userId !== "admin" &&
        item.authorName !== "Administrateur"
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Historique"
        title="Souvenirs et témoignages"
        subtitle="Les voyages déjà réalisés, et la parole des voyageurs — telle qu’ils l’ont écrite."
      />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          <a href="#voyages" className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
            Voyages réalisés
          </a>
          <a href="#temoignages" className="rounded-full bg-gold/15 px-4 py-2 text-sm font-semibold text-navy">
            Témoignages
          </a>
        </div>
      </section>

      <section id="voyages" className="mx-auto max-w-7xl scroll-mt-8 px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Voyages réalisés
        </p>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Photos et vidéos</h2>
        {trips.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            Les souvenirs de voyage seront bientôt publiés ici.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {trips.map((trip) => {
              const cover = trip.images[0] ?? "/background/hero.png";
              return (
                <a
                  key={trip.id}
                  href={`/historique/${trip.id}`}
                  className="overflow-hidden rounded-xl bg-white shadow-card transition-shadow hover:shadow-lg sm:rounded-2xl"
                >
                  <div className="relative aspect-[16/10] sm:aspect-[4/3]">
                    <Image
                      src={cover}
                      alt={trip.title}
                      fill
                      className="object-cover"
                    />
                    {trip.video ? (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-xs">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Vidéo
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3 sm:p-5">
                    <h3 className="text-sm font-bold text-navy sm:text-lg">{trip.title}</h3>
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-500 sm:mt-2 sm:items-center sm:text-sm">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold sm:mt-0 sm:h-4 sm:w-4" />
                      {trip.location}
                    </p>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500 sm:items-center sm:text-sm">
                      <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold sm:mt-0 sm:h-4 sm:w-4" />
                      {new Date(`${trip.date}T00:00:00`).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                    <p className="mt-3 hidden line-clamp-2 text-sm text-gray-600 sm:block">
                      {trip.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gold">
                      {trip.images.length} photo
                      {trip.images.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section
        id="temoignages"
        className="scroll-mt-8 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Témoignages
          </p>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            Ils ont voyagé avec MD Tours
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-gray-500">
            Les avis sont rédigés par les voyageurs. MD Tours n’en modifie pas
            le texte.
          </p>

          {testimonials.length === 0 ? (
            <p className="mt-8 text-sm text-gray-500">
              Les premiers témoignages seront publiés ici.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card"
                >
                  {(item.images ?? []).length === 1 ? (
                    <div className="relative aspect-[16/9] sm:aspect-[16/10]">
                      <Image
                        src={item.images![0]}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (item.images ?? []).length > 1 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {(item.images ?? []).slice(0, 4).map((src) => (
                        <div key={src} className="relative aspect-[4/3]">
                          <Image src={src} alt="" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < Math.round(item.rating)
                              ? "fill-gold text-gold"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">
                      “{item.message}”
                    </p>
                    <p className="mt-5 font-semibold text-navy">{item.authorName}</p>
                    <p className="text-xs uppercase tracking-wide text-gold">
                      {item.tripTitle}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
