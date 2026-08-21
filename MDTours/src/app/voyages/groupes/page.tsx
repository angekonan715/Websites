import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import TripCard from "@/components/TripCard";
import { getDestinations } from "@/lib/store";

export default async function GroupTripsPage() {
  const destinations = await getDestinations();

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Voyage groupé"
        title="Voyages proposés par MD Tours"
        subtitle="Découvrez les circuits disponibles, choisissez votre destination et réservez."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {destinations.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun voyage groupé n’est publié pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {destinations.map((dest) => (
              <TripCard key={dest.id} dest={dest} />
            ))}
          </div>
        )}
        <p className="mt-10 text-center text-sm text-gray-500">
          Vous préférez un séjour sur mesure ?{" "}
          <a href="/voyage-personnalise" className="font-semibold text-gold">
            Concevoir un voyage personnalisé
          </a>
        </p>
      </section>
    </main>
  );
}
