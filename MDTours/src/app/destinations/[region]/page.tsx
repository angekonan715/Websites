import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { findMegaRegion } from "@/lib/megaMenus";
import { getMegaMenus } from "@/lib/store";

export default async function DestinationRegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region: regionId } = await params;
  const menus = await getMegaMenus();
  const region = findMegaRegion(menus.destinations, regionId);
  if (!region) notFound();

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Destinations"
        title={region.label}
        subtitle={region.tagline || "Les lieux de cette région."}
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <a href="/destinations" className="text-sm font-semibold text-gold">
          ← Tous les pays / régions
        </a>
        {region.destinations.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            Aucun lieu n’a encore été ajouté dans {region.label}.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {region.destinations.map((place) => (
              <a
                key={place.id}
                href={place.href}
                className="group relative overflow-hidden rounded-sm bg-navy shadow-card"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={place.image || region.image}
                    alt={place.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <h2 className="font-editorial text-lg font-semibold text-white sm:text-xl">
                      {place.label}
                    </h2>
                    {place.description ? (
                      <p className="mt-1 hidden text-xs text-white/75 sm:line-clamp-2 sm:block">
                        {place.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
