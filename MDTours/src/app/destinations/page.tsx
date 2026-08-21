import Image from "next/image";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { getDestinations } from "@/lib/store";

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  const countries = Array.from(new Set(destinations.map((item) => item.country)));

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Destinations"
        title="Où souhaitez-vous partir ?"
        subtitle="Le Ghana d’abord, puis l’Afrique de l’Ouest : villes, côtes, chutes d’eau et parcs."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {countries.map((country) => (
          <div key={country} className="mb-12">
            <h2 className="text-2xl font-bold text-navy">{country}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {destinations
                .filter((item) => item.country === country)
                .map((dest) => (
                  <a
                    key={dest.id}
                    href={`/voyages/${dest.id}`}
                    className="overflow-hidden rounded-xl bg-white shadow-card sm:rounded-2xl"
                  >
                    <div className="relative aspect-[16/10] sm:aspect-[4/3]">
                      <Image
                        src={dest.image}
                        alt={dest.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm font-semibold text-navy sm:text-base">{dest.title}</h3>
                      <p className="mt-1 text-xs text-gray-500 sm:text-sm">{dest.duration}</p>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
