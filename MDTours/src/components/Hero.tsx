import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Header from "./Header";
import SearchBar from "./SearchBar";
import { getHeroSettings, getMegaMenus } from "@/lib/store";

const heroMediaClass =
  "absolute inset-0 !h-full !w-full max-h-none min-h-full min-w-full object-cover object-center";

export default async function Hero() {
  const [media, menus] = await Promise.all([getHeroSettings(), getMegaMenus()]);

  return (
    <section className="relative">
      <div className="relative min-h-[28rem] overflow-hidden pb-24 sm:min-h-[36rem] sm:pb-28 lg:min-h-[88vh]">
        {media.video ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={media.image}
            className={heroMediaClass}
          >
            <source src={media.video} />
          </video>
        ) : (
          <Image
            src={media.image}
            alt={media.alt}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-navy/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/15 to-navy/25" />

        <Header initialMenus={menus} />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-10 pt-28 text-center sm:px-6 sm:pb-16 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-44">
          <p className="section-kicker text-gold-light">Le guide de confiance</p>
          <h1 className="mt-4 font-editorial text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-7xl">
            Trouvez votre prochaine
            <br />
            grande aventure
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:mt-6 sm:text-lg">
            Voyages en petit groupe en Afrique de l’Ouest — préparés avec soin,
            racontés avec cœur.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            <a href="/voyages" className="btn-gold">
              Explorer les voyages
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/voyages/groupes" className="btn-outline-white">
              Voir le catalogue
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-40 -mt-12 px-3 sm:-mt-16 sm:px-6 lg:px-8">
        <SearchBar />
      </div>
    </section>
  );
}
