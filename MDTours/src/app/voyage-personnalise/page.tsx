import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import CustomTripBuilder from "@/components/CustomTripBuilder";

export default function CustomTripPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Voyage personnalisé"
        title="Composez votre séjour"
        subtitle="Voyageurs, dates, hébergement, véhicule et activités : le tarif se calcule au fur et à mesure."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <CustomTripBuilder />
      </section>
    </main>
  );
}
