import { placesLabel } from "@/lib/availability";
import type { Destination } from "@/lib/types";

export default function PlacesBadge({
  dest,
  variant = "overlay",
}: {
  dest: Destination;
  variant?: "overlay" | "light";
}) {
  const available = dest.availablePlaces ?? dest.capacity;
  const full = available <= 0;
  const label =
    variant === "overlay"
      ? available <= 0
        ? "Complet"
        : `${available} place${available > 1 ? "s" : ""}`
      : placesLabel(available);

  if (variant === "light") {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          full ? "bg-red-50 text-red-700" : "bg-gold/10 text-navy"
        }`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`absolute right-2.5 top-2.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[10px] ${
        full ? "bg-red-600 text-white" : "bg-white/90 text-navy"
      }`}
    >
      {label}
    </span>
  );
}
