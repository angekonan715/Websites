import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import Header from "@/components/Header";
import BookingForm from "@/components/BookingForm";
import { formatPrice } from "@/data/home";
import { getDestinations } from "@/lib/store";

export default async function VoyagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const destinations = await getDestinations();
  const destination = destinations.find((item) => item.id === id);
  if (!destination) notFound();
  const gallery = destination.gallery ?? [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <article>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-navy">
            {destination.video ? (
              <video
                controls
                playsInline
                poster={destination.image}
                className="h-full w-full object-cover"
              >
                <source src={destination.video} />
              </video>
            ) : (
              <Image
                src={destination.image}
                alt={destination.title}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>

          {gallery.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {gallery.map((photo) => (
                <div key={photo} className="relative aspect-square overflow-hidden rounded-xl">
                  <Image src={photo} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            {destination.country}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-4xl">
            {destination.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {destination.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-gold text-gold" />
              {destination.rating.toLocaleString("fr-FR", {
                minimumFractionDigits: 1,
              })}{" "}
              ({destination.reviews})
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-navy">
            À partir de {formatPrice(destination.price)} FCFA
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
            {destination.description ||
              "Réservez ce séjour. Après validation, MD Tours vous contacte pour convenir du paiement de façon sécurisée, puis confirme votre rendez-vous."}
          </p>
        </article>

        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
          <BookingForm destination={destination} />
        </Suspense>
      </div>
    </main>
  );
}
