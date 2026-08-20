import { Suspense } from "react";
import CustomTripCta from "@/components/CustomTripCta";
import Destinations from "@/components/Destinations";
import Hero from "@/components/Hero";
import TrustBadges from "@/components/TrustBadges";

export default function Home() {
  return (
    <main>
      <Hero />
      <Suspense fallback={<DestinationsFallback />}>
        <Destinations />
      </Suspense>
      <CustomTripCta />
      <TrustBadges />
    </main>
  );
}

function DestinationsFallback() {
  return (
    <section className="bg-white px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 h-16 w-72 animate-pulse rounded-lg bg-gray-100" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
