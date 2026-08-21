import { ArrowRight, Clock, Star } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/data/home";
import type { Destination } from "@/lib/types";

export default function TripCard({ dest }: { dest: Destination }) {
  return (
    <a
      href={`/voyages/${dest.id}`}
      className="group relative overflow-hidden rounded-2xl shadow-card transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
        <Image
          src={dest.image}
          alt={dest.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <span className="absolute left-4 top-4 rounded-md bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          {dest.country}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white">{dest.title}</h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
            <Clock className="h-3.5 w-3.5" />
            {dest.duration}
          </div>
          <p className="mt-2 text-sm font-bold text-white">
            À partir de {formatPrice(dest.price)} FCFA
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-gold text-gold" strokeWidth={0} />
              <span className="text-sm font-semibold text-white">
                {dest.rating.toLocaleString("fr-FR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-xs text-white/70">({dest.reviews})</span>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gold group-hover:bg-gold group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
