import Image from "next/image";

export default function CustomTripCta() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-sm bg-navy lg:grid-cols-2">
        <div className="relative min-h-[16rem] lg:min-h-[22rem]">
          <Image
            src="/images/mole-national-park.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="flex flex-col justify-center px-6 py-10 text-white sm:px-12 sm:py-14">
          <p className="section-kicker">Voyage personnalisé</p>
          <h2 className="mt-3 font-editorial text-3xl font-semibold sm:text-4xl">
            Vous avez une autre idée de voyage ?
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
            Composez votre séjour : voyageurs, dates, hébergement, véhicule et
            activités. Le tarif s’affiche au fur et à mesure, sans surprise.
          </p>
          <a href="/voyage-personnalise" className="btn-gold mt-8 w-fit">
            Créer un voyage personnalisé
          </a>
        </div>
      </div>
    </section>
  );
}
