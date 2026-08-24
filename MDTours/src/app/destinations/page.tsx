import Image from "next/image";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { getMegaMenus } from "@/lib/store";

export default async function DestinationsPage() {
  const menus = await getMegaMenus();
  const regions = menus.destinations;

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Destinations"
        title="Pays et régions"
        subtitle="Découvrez les lieux que MD Tours fait vivre, pays par pays."
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {regions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune région n’est publiée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => (
              <a
                key={region.id}
                href={region.href}
                className="group relative min-h-[18rem] overflow-hidden rounded-sm"
              >
                <Image
                  src={region.image}
                  alt={region.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h2 className="font-editorial text-3xl font-semibold text-white">
                    {region.label}
                  </h2>
                  {region.tagline ? (
                    <p className="mt-1 text-sm text-white/75">{region.tagline}</p>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
