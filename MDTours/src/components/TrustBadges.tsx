import { ArrowRight } from "lucide-react";
import {
  Headphones,
  Shield,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { trustBadges } from "@/data/home";

const iconMap = {
  shield: Shield,
  tag: Tag,
  headset: Headphones,
  users: Users,
  "shield-check": ShieldCheck,
};

export default function TrustBadges() {
  return (
    <section className="bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="section-kicker">L’esprit MD Tours</p>
        <h2 className="section-title mt-3">La beauté des voyages en petit groupe</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-navy/70 sm:text-base">
          Moins de monde, plus de présence. Nous préparons chaque séjour pour que
          vous voyagiez l’esprit libre.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {trustBadges.map((badge) => {
            const Icon = iconMap[badge.icon as keyof typeof iconMap];
            return (
              <div key={badge.title} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-white">
                  <Icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 font-editorial text-xl font-semibold text-navy">
                  {badge.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/65">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>

        <a href="/a-propos" className="btn-outline-navy mt-12">
          Découvrir notre approche
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
