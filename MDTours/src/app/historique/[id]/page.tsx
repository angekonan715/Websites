import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { getHistoryTrips } from "@/lib/store";

export default async function HistoriqueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = (await getHistoryTrips()).find((item) => item.id === id);
  if (!trip) notFound();

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Historique"
        title={trip.title}
        subtitle={`${trip.location} · ${new Date(`${trip.date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
      />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        {trip.description ? (
          <p className="max-w-3xl text-base leading-relaxed text-gray-600">
            {trip.description}
          </p>
        ) : null}

        {trip.video ? (
          <div className="mt-8 overflow-hidden rounded-2xl bg-navy">
            <video
              controls
              playsInline
              poster={trip.images[0]}
              className="aspect-video w-full"
            >
              <source src={trip.video} />
            </video>
          </div>
        ) : null}

        {trip.images.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-4">
            {trip.images.map((src) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg sm:rounded-2xl">
                <Image src={src} alt={trip.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-gray-500">Aucune photo pour ce voyage.</p>
        )}

        <a
          href="/historique"
          className="mt-10 inline-block text-sm font-semibold text-gold"
        >
          ← Retour à l’historique
        </a>
      </section>
    </main>
  );
}
