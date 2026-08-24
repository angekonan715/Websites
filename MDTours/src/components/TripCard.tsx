import { ArrowRight, Clock, Star } from "lucide-react";
import Image from "next/image";
import PlacesBadge from "@/components/PlacesBadge";
import TripPrice from "@/components/TripPrice";
import type { Destination } from "@/lib/types";

export default function TripCard({ dest }: { dest: Destination }) {
  return (
    <a
      href={`/voyages/${dest.id}`}
      className="group relative overflow-hidden rounded-xl shadow-card transition-transform hover:-translate-y-1 sm:rounded-2xl"
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[4/3] xl:aspect-[4/5]">
        <Image
          src={dest.image}
          alt={dest.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[10px]">
          {dest.country}
        </span>
        <PlacesBadge dest={dest} />
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
          <h3 className="text-sm font-bold leading-snug text-white sm:text-lg">{dest.title}</h3>
          <div className="mt-1 hidden items-center gap-1.5 text-xs text-white/80 sm:mt-1.5 sm:flex">
            <Clock className="h-3.5 w-3.5" />
            {dest.duration}
          </div>
          <p className="mt-1 text-xs sm:mt-2 sm:text-sm">
            <TripPrice dest={dest} light />
          </p>
          <div className="mt-2 flex items-center justify-between sm:mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold text-gold sm:h-4 sm:w-4" strokeWidth={0} />
              <span className="text-xs font-semibold text-white sm:text-sm">
                {dest.rating.toLocaleString("fr-FR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="hidden text-xs text-white/70 sm:inline">({dest.reviews})</span>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gold group-hover:bg-gold group-hover:text-white sm:h-9 sm:w-9">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
