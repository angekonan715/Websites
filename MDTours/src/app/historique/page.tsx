import Image from "next/image";
import { Calendar, MapPin, PlayCircle } from "lucide-react";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { getHistoryTrips } from "@/lib/store";

export default async function HistoriquePage() {
  const trips = (await getHistoryTrips()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Historique"
        title="Les voyages déjà réalisés"
        subtitle="Photos, vidéos et souvenirs des séjours organisés par MD Tours."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {trips.length === 0 ? (
          <p className="text-sm text-gray-500">
            Les souvenirs de voyage seront bientôt publiés ici.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const cover = trip.images[0] ?? "/background/hero.png";
              return (
                <a
                  key={trip.id}
                  href={`/historique/${trip.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-card transition-shadow hover:shadow-lg"
                >
                  <div className="relative h-56">
                    <Image
                      src={cover}
                      alt={trip.title}
                      fill
                      className="object-cover"
                    />
                    {trip.video ? (
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Vidéo
                      </span>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-navy">{trip.title}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-4 w-4 text-gold" />
                      {trip.location}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gold" />
                      {new Date(`${trip.date}T00:00:00`).toLocaleDateString(
                        "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
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
    </main>
  );
}
