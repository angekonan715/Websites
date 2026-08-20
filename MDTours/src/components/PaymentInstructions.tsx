import { agencyContact, formatPrice } from "@/data/home";
import type { Reservation } from "@/lib/types";

export default function PaymentInstructions({
  reservation,
}: {
  reservation: Reservation;
}) {
  const whatsappUrl = `https://wa.me/${agencyContact.whatsapp}`;

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
        Paiement sécurisé
      </p>
      <h2 className="mt-2 text-xl font-bold text-navy">
        MD Tours vous contacte pour confirmer le paiement
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        Pour éviter les arnaques, aucun paiement n’est pris en ligne. Un conseiller
        MD Tours vous appellera ou vous écrira sur le numéro et l’email de cette
        réservation. Ne payez que si la personne cite votre référence{" "}
        <strong className="text-navy">{reservation.reference}</strong> et le
        montant de{" "}
        <strong className="text-navy">
          {formatPrice(reservation.totalPrice)} FCFA
        </strong>
        .
      </p>

      <ol className="mt-5 space-y-3 text-sm text-navy">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
            1
          </span>
          Attendez le contact de MD Tours (appel ou WhatsApp officiel).
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
            2
          </span>
          Vérifiez la référence {reservation.reference} avant tout envoi d’argent.
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
            3
          </span>
          Payez uniquement via Mobile Money, virement ou en agence indiqués par
          MD Tours.
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
            4
          </span>
          L’admin confirme ensuite votre paiement, puis votre rendez-vous.
        </li>
      </ol>

      <div className="mt-6 rounded-xl bg-white p-4 text-sm">
        <p className="font-semibold text-navy">Coordonnées officielles MD Tours</p>
        <p className="mt-2 text-gray-600">Tél. {agencyContact.phone}</p>
        <p className="text-gray-600">Email {agencyContact.email}</p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex font-semibold text-gold hover:underline"
        >
          WhatsApp officiel
        </a>
        <p className="mt-3 text-xs text-gray-500">
          Si quelqu’un vous contacte sans cette référence, ne payez pas et
          écrivez-nous à {agencyContact.email}.
        </p>
      </div>
    </div>
  );
}
