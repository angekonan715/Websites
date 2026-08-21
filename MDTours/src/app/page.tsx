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
    <section className="bg-white px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 h-16 w-72 animate-pulse rounded-lg bg-gray-100" />
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[16/10] animate-pulse rounded-xl bg-gray-100 sm:aspect-[4/3] sm:rounded-2xl xl:aspect-[4/5]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
