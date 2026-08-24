import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import { customTripStatusLabel, formatPrice } from "@/data/home";
import { getCurrentUser } from "@/lib/auth";
import { formatAdminDate } from "@/lib/csv";
import { accommodationLabels, vehicleLabels } from "@/lib/personalizedQuote";
import { customTripAmount, isOwnBooking } from "@/lib/records";
import { getCustomTripById } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CustomTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) {
    redirect(`/connexion?next=/voyage-personnalise/${id}`);
  }

  const item = await getCustomTripById(id);
  if (!item || !isOwnBooking(user, item)) {
    notFound();
  }

  const total = customTripAmount(item);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-search sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              {item.reference}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-navy">
              Voyage personnalisé
              {item.destination ? ` · ${item.destination}` : ""}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {item.adults ?? item.travelers} adulte
              {(item.adults ?? 0) > 1 ? "s" : ""}
              {(item.childrenUnder12 ?? 0) > 0
                ? ` · ${item.childrenUnder12} enfant(s) -12 ans`
                : ""}
              {(item.childrenUnder16 ?? 0) > 0
                ? ` · ${item.childrenUnder16} enfant(s) -16 ans`
                : ""}
            </p>
            {item.departureDate ? (
              <p className="mt-1 text-sm text-gray-500">
                {formatAdminDate(item.departureDate)}
                {item.returnDate ? ` → ${formatAdminDate(item.returnDate)}` : ""}
                {item.nights ? ` · ${item.nights} nuit${item.nights > 1 ? "s" : ""}` : ""}
              </p>
            ) : null}
            {item.accommodation && item.vehicle ? (
              <p className="mt-1 text-sm text-gray-500">
                {accommodationLabels[item.accommodation]} · véhicule{" "}
                {vehicleLabels[item.vehicle]}
              </p>
            ) : null}
            <p className="mt-3 inline-flex rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">
              {customTripStatusLabel[item.status] ?? item.status}
            </p>
            {item.suggestion ? (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                {item.suggestion}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-navy p-6 text-white shadow-search">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Récapitulatif
            </p>
            <p className="mt-2 text-3xl font-bold">
              {formatPrice(total)}{" "}
              <span className="text-base font-medium text-white/70">FCFA</span>
            </p>
            <dl className="mt-5 space-y-2 text-sm text-white/80">
              {(item.quote?.breakdown ?? []).map((line) => (
                <div key={line.label} className="flex justify-between gap-4">
                  <dt>{line.label}</dt>
                  <dd className="shrink-0">{formatPrice(line.amount)} FCFA</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-white/10 pt-3 font-semibold text-white">
                <dt>Total</dt>
                <dd>{formatPrice(total)} FCFA</dd>
              </div>
            </dl>
            {item.quoteEmailSentAt ? (
              <p className="mt-4 text-xs text-white/50">
                Un récapitulatif a aussi été envoyé par e-mail.
              </p>
            ) : (
              <p className="mt-4 text-xs text-white/50">
                MD Tours confirmera ce montant avant le paiement.
              </p>
            )}
          </div>

          {item.status === "pending" && (
            <p className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-sm text-navy">
              Votre voyage est enregistré. MD Tours vous recontacte pour
              confirmer les disponibilités et le paiement.
            </p>
          )}

          {item.proposalDetails ? (
            <div className="rounded-2xl bg-white p-4 shadow-search sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                Message MD Tours
              </p>
              <h2 className="mt-2 text-xl font-bold text-navy">
                {item.proposalTitle || "Détails de votre séjour"}
              </h2>
              {item.proposedDuration ? (
                <p className="mt-2 text-sm text-gray-500">{item.proposedDuration}</p>
              ) : null}
              {item.proposedPrice ? (
                <p className="mt-1 text-lg font-bold text-navy">
                  {formatPrice(item.proposedPrice)} FCFA
                </p>
              ) : null}
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {item.proposalDetails}
              </p>
              <a href="/contact" className="btn-gold mt-6 inline-flex">
                Contacter MD Tours
              </a>
            </div>
          ) : null}

          <a href="/reservations" className="text-sm font-semibold text-gold">
            Voir toutes mes réservations
          </a>
        </div>
      </div>
    </main>
  );
}
