import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { customTripStatusLabel, formatPrice, reservationStatusLabel } from "@/data/home";
import { getCurrentUser } from "@/lib/auth";
import { formatAdminDate } from "@/lib/csv";
import {
  customTripAmount,
  isOwnBooking,
  reservationPaidAmount,
} from "@/lib/records";
import { getCustomTrips, getReservations } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion?next=/reservations");
  }

  const [reservations, customTrips] = await Promise.all([
    getReservations(),
    getCustomTrips(),
  ]);

  const mine = reservations.filter((item) => isOwnBooking(user, item));
  const myCustom = customTrips.filter((item) => isOwnBooking(user, item));

  const items = [
    ...mine.map((item) => ({
      kind: "reservation" as const,
      id: item.id,
      href: `/reservations/${item.id}`,
      reference: item.reference,
      title: item.destinationTitle,
      country: item.country,
      duration: item.duration,
      travelers: item.travelers,
      unitPrice: item.unitPrice,
      total: item.totalPrice,
      paid: reservationPaidAmount(item),
      status: item.status,
      statusLabel: reservationStatusLabel[item.status] ?? item.status,
      departureDate: item.departureDate,
      cancelled: item.status === "cancelled",
      createdAt: item.createdAt,
    })),
    ...myCustom.map((item) => {
      const total = customTripAmount(item);
      return {
        kind: "custom" as const,
        id: item.id,
        href: `/voyage-personnalise/${item.id}`,
        reference: item.reference,
        title: item.destination || "Voyage personnalisé",
        country: "Personnalisé",
        duration: item.nights
          ? `${item.nights} nuit${item.nights > 1 ? "s" : ""}`
          : "",
        travelers: item.travelers,
        unitPrice: undefined as number | undefined,
        total,
        paid: 0,
        status: item.status,
        statusLabel: customTripStatusLabel[item.status] ?? item.status,
        departureDate: item.departureDate,
        cancelled: item.status === "closed",
        createdAt: item.createdAt,
      };
    }),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const open = items.filter((item) => !item.cancelled);
  const totalAmount = open.reduce((sum, item) => sum + item.total, 0);
  const paidAmount = open.reduce((sum, item) => sum + item.paid, 0);
  const travelers = open.reduce((sum, item) => sum + item.travelers, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Mes réservations</h1>
        <p className="mt-2 text-sm text-gray-500">
          Retrouvez le total et le détail de chaque voyage enregistré avec{" "}
          {user.email}.
        </p>

        {items.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <SummaryStat label="Voyages" value={String(open.length)} />
            <SummaryStat
              label="Total estimé"
              value={`${formatPrice(totalAmount)} FCFA`}
            />
            <SummaryStat
              label="Déjà confirmé"
              value={`${formatPrice(paidAmount)} FCFA`}
              hint={
                travelers > 0
                  ? `${travelers} voyageur${travelers > 1 ? "s" : ""}`
                  : undefined
              }
            />
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white px-5 py-8 text-center text-sm text-gray-500 shadow-card">
            Aucune réservation pour le moment.{" "}
            <a href="/voyages" className="font-semibold text-gold">
              Voir les voyages
            </a>
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <a
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="block rounded-2xl bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gold">
                      {item.reference}
                    </p>
                    <h2 className="mt-1 font-semibold text-navy">{item.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.kind === "custom" ? "Voyage personnalisé" : item.country}
                      {item.duration ? ` · ${item.duration}` : ""}
                      {` · ${item.travelers} voyageur${item.travelers > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                    {item.statusLabel}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-gray-400">Départ</dt>
                    <dd className="mt-0.5 font-medium text-navy">
                      {item.departureDate
                        ? formatAdminDate(item.departureDate)
                        : "À confirmer"}
                    </dd>
                  </div>
                  {item.unitPrice ? (
                    <div>
                      <dt className="text-xs text-gray-400">Prix / personne</dt>
                      <dd className="mt-0.5 font-medium text-navy">
                        {formatPrice(item.unitPrice)} FCFA
                      </dd>
                    </div>
                  ) : (
                    <div>
                      <dt className="text-xs text-gray-400">Type</dt>
                      <dd className="mt-0.5 font-medium text-navy">Devis personnalisé</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-gray-400">Total</dt>
                    <dd className="mt-0.5 text-lg font-bold text-navy">
                      {formatPrice(item.total)} FCFA
                    </dd>
                    {item.paid > 0 ? (
                      <p className="text-xs text-emerald-700">Paiement confirmé</p>
                    ) : (
                      <p className="text-xs text-gray-400">En attente de paiement</p>
                    )}
                  </div>
                </dl>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
