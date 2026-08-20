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
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-6 py-8 sm:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {trustBadges.map((badge) => {
              const Icon = iconMap[badge.icon as keyof typeof iconMap];
              return (
                <div key={badge.title} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gold/40 bg-white">
                    <Icon className="h-5 w-5 text-gold" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{badge.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
