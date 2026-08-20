import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import TrustBadges from "@/components/TrustBadges";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="À propos"
        title="MD Tours, pour voyager autrement"
        subtitle="Nous concevons des séjours authentiques en Afrique, avec un accompagnement humain avant, pendant et après le voyage."
      />
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-lg leading-relaxed text-gray-600">
          MD Tours est née d’une conviction simple : l’Afrique se vit intensément
          quand le voyage est préparé avec soin. Nous organisons des expériences
          au Ghana et en Afrique de l’Ouest — villes, patrimoine, nature et
          rencontres — pour des voyageurs qui veulent plus qu’un séjour standard.
        </p>
        <p className="mt-6 leading-relaxed text-gray-600">
          Notre équipe s’occupe des itinéraires, des hébergements, des
          transferts et du suivi. Vous restez libres de savourer le moment ;
          nous veillons à ce que chaque étape soit claire, sûre et mémorable.
        </p>
      </section>
      <TrustBadges />
    </main>
  );
}
