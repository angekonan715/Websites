import { ArrowRight } from "lucide-react";
import Image from "next/image";

const stories = [
  {
    href: "/a-propos",
    image: "/images/waterfall.png",
    kicker: "L’agence",
    title: "MD Tours, pour voyager autrement",
    text: "Nous concevons des séjours authentiques en Afrique de l’Ouest, avec un accompagnement humain à chaque étape.",
  },
  {
    href: "/historique",
    image: "/images/cape-coast.png",
    kicker: "Souvenirs",
    title: "Des voyages qui restent",
    text: "Retrouvez les séjours déjà vécus : les lieux, les visages, et l’esprit de ceux qui ont voyagé avec nous.",
  },
  {
    href: "/voyage-personnalise",
    image: "/images/beach.png",
    kicker: "Sur mesure",
    title: "Composez votre propre itinéraire",
    text: "Dates, hébergement, véhicule, activités : le tarif se construit avec vous, en toute clarté.",
  },
];

export default function EditorialStories() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="section-kicker">À la une</p>
          <h2 className="section-title mt-3">Récits et inspirations</h2>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {stories.map((story) => (
            <a
              key={story.href}
              href={story.href}
              className="group flex flex-col overflow-hidden rounded-sm bg-cream"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={story.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                  {story.kicker}
                </p>
                <h3 className="mt-3 font-editorial text-2xl font-semibold leading-snug text-navy">
                  {story.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-navy/70">
                  {story.text}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
                  Lire la suite
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
