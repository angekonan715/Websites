import { CalendarRange, MapPinned } from "lucide-react";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";

const options = [
  {
    href: "/voyages/groupes",
    kicker: "Offres MD Tours",
    title: "Voyage groupé",
    description:
      "Circuits déjà organisés par l’agence : dates, programme et tarif fixés. Choisissez parmi les voyages disponibles.",
    points: ["Départs collectifs", "Itinéraires prêts", "Accompagnement MD Tours"],
    icon: MapPinned,
  },
  {
    href: "/voyage-personnalise",
    kicker: "Sur mesure",
    title: "Voyage personnalisé",
    description:
      "Composez votre séjour : voyageurs, dates, hébergement, véhicule et activités, avec le tarif en direct.",
    points: ["Adultes et enfants", "Hôtel ou résidence", "Devis immédiat"],
    icon: CalendarRange,
  },
];

export default function VoyagesChooserPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Nos voyages"
        title="Comment souhaitez-vous voyager ?"
        subtitle="Choisissez un voyage groupé déjà proposé par MD Tours, ou concevez un séjour personnalisé."
      />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {options.map((option) => (
            <a
              key={option.href}
              href={option.href}
              className="group rounded-3xl border border-gray-100 bg-white p-8 shadow-card transition-shadow hover:shadow-lg"
            >
              <option.icon className="h-10 w-10 text-gold" />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-gold">
                {option.kicker}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-navy">{option.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {option.description}
              </p>
              <ul className="mt-5 space-y-2">
                {option.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 text-sm text-navy"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    {point}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex text-sm font-semibold text-gold group-hover:underline">
                Continuer →
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
