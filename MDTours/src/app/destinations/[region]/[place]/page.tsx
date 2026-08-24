import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { findMegaPlace, findMegaRegion } from "@/lib/megaMenus";
import { getMegaMenus } from "@/lib/store";

export default async function DestinationPlacePage({
  params,
}: {
  params: Promise<{ region: string; place: string }>;
}) {
  const { region: regionId, place: placeId } = await params;
  const menus = await getMegaMenus();
  const region = findMegaRegion(menus.destinations, regionId);
  if (!region) notFound();
  const place = findMegaPlace(region, placeId);
  if (!place) notFound();

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          {region.label}
        </p>
        <h1 className="mt-2 font-editorial text-4xl font-semibold text-navy sm:text-5xl">
          {place.label}
        </h1>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-sm bg-navy">
          <Image
            src={place.image || region.image}
            alt={place.label}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
        {place.description ? (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy/75">
            {place.description}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-4">
          <a href={region.href} className="text-sm font-semibold text-gold">
            ← {region.label}
          </a>
          <a href="/voyages/groupes" className="text-sm font-semibold text-navy">
            Voir les voyages groupés
          </a>
        </div>
      </article>
    </main>
  );
}
