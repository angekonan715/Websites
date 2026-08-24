import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import PaymentInstructions from "@/components/PaymentInstructions";
import { formatPrice, reservationStatusLabel } from "@/data/home";
import { getCurrentUser } from "@/lib/auth";
import { formatAdminDate } from "@/lib/csv";
import { isOwnBooking, reservationPaidAmount } from "@/lib/records";
import { getReservationById } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) {
    redirect(`/connexion?next=/reservations/${id}`);
  }

  const reservation = await getReservationById(id);
  if (!reservation || !isOwnBooking(user, reservation)) {
    notFound();
  }

  const paid = reservationPaidAmount(reservation);
  const unit = reservation.unitPrice || 0;
  const total = reservation.totalPrice || 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl bg-white shadow-search">
            <div className="relative aspect-[16/9] bg-navy sm:aspect-[2/1]">
              {reservation.image ? (
                // Local trip photos can be missing; a plain img still shows the rest of the dossier.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={reservation.image}
                  alt={reservation.destinationTitle}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                Référence {reservation.reference}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-navy">
                {reservation.destinationTitle}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {reservation.country}
                {reservation.duration ? ` · ${reservation.duration}` : ""}
              </p>
              <p className="mt-3 inline-flex rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
                {reservationStatusLabel[reservation.status] ?? reservation.status}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-search">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Récapitulatif
            </p>
            <p className="mt-2 text-3xl font-bold text-navy">
              {formatPrice(total)}{" "}
              <span className="text-base font-medium text-gray-400">FCFA</span>
            </p>
            <dl className="mt-5 divide-y divide-gray-100 text-sm">
              <SummaryRow label="Voyageurs" value={String(reservation.travelers)} />
              <SummaryRow
                label="Prix unitaire"
                value={`${formatPrice(unit)} FCFA`}
              />
              <SummaryRow
                label="Total"
                value={`${formatPrice(total)} FCFA`}
                strong
              />
              <SummaryRow
                label="Montant confirmé"
                value={`${formatPrice(paid)} FCFA`}
              />
              <SummaryRow
                label="Départ"
                value={
                  reservation.departureDate
                    ? formatAdminDate(reservation.departureDate)
                    : "À confirmer par MD Tours"
                }
              />
              <SummaryRow label="Nom" value={reservation.name} />
              <SummaryRow label="Email" value={reservation.email} />
              <SummaryRow label="Téléphone" value={reservation.phone || "—"} />
            </dl>
            {reservation.notes ? (
              <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-600">
                {reservation.notes}
              </p>
            ) : null}
          </div>

          <PaymentInstructions reservation={reservation} />
          <a href="/reservations" className="text-sm font-semibold text-gold">
            Voir toutes mes réservations
          </a>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right ${strong ? "font-bold text-navy" : "text-navy"}`}>
        {value}
      </dd>
    </div>
  );
}
