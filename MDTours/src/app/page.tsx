import { Suspense } from "react";
import CustomTripCta from "@/components/CustomTripCta";
import EditorialStories from "@/components/EditorialStories";
import GuestFeedback from "@/components/GuestFeedback";
import Hero from "@/components/Hero";
import TripCatalog from "@/components/TripCatalog";
import { getDestinations } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const trips = await getDestinations();

  return (
    <main>
      <Hero />
      <Suspense fallback={<CatalogFallback />}>
        <TripCatalog trips={trips} />
      </Suspense>
      <EditorialStories />
      <GuestFeedback />
      <CustomTripCta />
    </main>
  );
}

function CatalogFallback() {
  return (
    <section className="bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 h-16 w-72 animate-pulse rounded-sm bg-cream-dark" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[14rem] animate-pulse rounded-sm bg-cream-dark sm:min-h-[18rem]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
