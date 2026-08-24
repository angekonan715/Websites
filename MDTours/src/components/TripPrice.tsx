import { formatPrice } from "@/data/home";
import { hasPromotion, tripUnitPrice } from "@/lib/pricing";
import type { Destination } from "@/lib/types";

export default function TripPrice({
  dest,
  prefix = "À partir de",
  light = false,
}: {
  dest: Destination;
  prefix?: string;
  light?: boolean;
}) {
  const current = tripUnitPrice(dest);
  const promo = hasPromotion(dest);

  return (
    <span className={light ? "text-white" : "text-navy"}>
      {promo ? (
        <>
          {dest.promotionLabel ? (
            <span
              className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                light ? "bg-gold text-white" : "bg-gold/15 text-gold"
              }`}
            >
              {dest.promotionLabel}
            </span>
          ) : null}
          <span className={`mr-1.5 line-through ${light ? "text-white/60" : "text-gray-400"}`}>
            {formatPrice(dest.price)}
          </span>
        </>
      ) : null}
      <span className={light ? "font-bold text-white" : "font-bold"}>
        {prefix ? `${prefix} ` : ""}
        {formatPrice(current)} FCFA
      </span>
    </span>
  );
}
