import type { Destination } from "./types";

export function hasPromotion(destination: Destination) {
  const promo = Number(destination.promotionPrice);
  return Boolean(
    destination.promotionEnabled &&
      Number.isFinite(promo) &&
      promo > 0 &&
      promo < destination.price
  );
}

export function tripUnitPrice(destination: Destination) {
  return hasPromotion(destination)
    ? Math.floor(Number(destination.promotionPrice))
    : destination.price;
}
