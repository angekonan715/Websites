"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Phone, Search } from "lucide-react";
import { formatPrice, reservationStatusLabel } from "@/data/home";
import { downloadCsv, formatAdminDate } from "@/lib/csv";
import { clientKey, groupBookingsByTrip, isPaidReservation } from "@/lib/records";
import type { Reservation, ReservationStatus } from "@/lib/types";

type BookingFilter = "all" | "awaiting_contact" | "payment_received" | "confirmed" | "cancelled";
type DeskView = "bookings" | "confirmed" | "roster";

const filters: { id: BookingFilter; label: string }[] = [
  { id: "all", label: "Tous les dossiers" },
  { id: "awaiting_contact", label: "En attente" },
  { id: "payment_received", label: "Payés" },
  { id: "confirmed", label: "Confirmés" },
  { id: "cancelled", label: "Annulés" },
];

function statusClass(status: ReservationStatus) {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-800";
  if (status === "payment_received") return "bg-gold/10 text-navy";
  if (status === "cancelled") return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-600";
}

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [view, setView] = useState<DeskView>("bookings");
  const [openId, setOpenId] = useState("");

  async function load() {
    const response = await fetch("/api/reservations");
    const data = (await response.json()) as { reservations?: Reservation[] };
    setReservations(data.reservations ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(id: string, status: ReservationStatus) {
    setError("");
    setNotice("");
    const response = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as {
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Mise à jour impossible.");
      return;
    }
    if (status === "payment_received") {
      setNotice(
        "Paiement confirmé. L’email de confirmation est en cours d’envoi au client."
      );
    }
    await load();
  }

  const stats = useMemo(() => {
    const paid = reservations.filter((item) => isPaidReservation(item.status));
    return {
      total: reservations.length,
      awaiting: reservations.filter((item) => item.status === "awaiting_contact").length,
      confirmed: reservations.filter((item) => item.status === "confirmed").length,
      revenue: paid.reduce((sum, item) => sum + item.totalPrice, 0),
    };
  }, [reservations]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reservations.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!needle) return true;
      return [
        item.reference,
        item.name,
        item.email,
        item.phone,
        item.destinationTitle,
        item.country,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [reservations, filter, query]);

  const confirmedGroups = useMemo(
    () => groupBookingsByTrip(reservations.filter((item) => item.status === "confirmed")),
    [reservations]
  );
  const rosterGroups = useMemo(() => groupBookingsByTrip(reservations), [reservations]);

  function exportCsv() {
    downloadCsv("reservations-mdtours.csv", [
      [
        "Référence",
        "Client",
        "Téléphone",
        "Email",
        "Voyage",
        "Pays",
        "Départ",
        "Voyageurs",
        "Montant",
        "Payé",
        "Statut",
        "Notes",
      ],
      ...visible.map((item) => [
        item.reference,
        item.name,
        item.phone,
        item.email,
        item.destinationTitle,
        item.country,
        item.departureDate,
        String(item.travelers),
        String(item.totalPrice),
        String(isPaidReservation(item.status) ? item.totalPrice : 0),
        reservationStatusLabel[item.status] ?? item.status,
        item.notes,
      ]),
    ]);
  }

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Dossiers" value={String(stats.total)} />
        <StatCard label="En attente" value={String(stats.awaiting)} />
        <StatCard label="Voyages confirmés" value={String(stats.confirmed)} />
        <StatCard label="Encaissé" value={`${formatPrice(stats.revenue)} FCFA`} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setView("bookings")}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            view === "bookings" ? "bg-navy text-white" : "bg-white text-navy shadow-card"
          }`}
        >
          Tous les dossiers
        </button>
        <button
          type="button"
          onClick={() => setView("roster")}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            view === "roster" ? "bg-navy text-white" : "bg-white text-navy shadow-card"
          }`}
        >
          Inscrits par voyage
        </button>
        <button
          type="button"
          onClick={() => setView("confirmed")}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            view === "confirmed" ? "bg-navy text-white" : "bg-white text-navy shadow-card"
          }`}
        >
          Voyages confirmés
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-navy"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter CSV
        </button>
      </div>

      {notice && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {view === "confirmed" || view === "roster" ? (
        <div className="mt-5 space-y-4">
          {(view === "confirmed" ? confirmedGroups : rosterGroups).length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-card">
              {view === "confirmed"
                ? "Aucun voyage confirmé pour le moment."
                : "Aucune inscription pour le moment."}
            </p>
          ) : (
            (view === "confirmed" ? confirmedGroups : rosterGroups).map((group) => {
              const travelers = group.travelers;
              const total = group.bookings.reduce((sum, item) => sum + item.totalPrice, 0);
              return (
                <article key={group.id} className="rounded-2xl bg-white p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gold">
                        {group.country} · Date du voyage {formatAdminDate(group.departureDate)}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-navy">{group.title}</h3>
                    </div>
                    <p className="text-sm font-semibold text-navy">
                      {group.bookings.length} dossier{group.bookings.length > 1 ? "s" : ""} ·{" "}
                      {travelers} voyageur{travelers > 1 ? "s" : ""} · {formatPrice(total)} FCFA
                    </p>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-gray-400">
                        <tr>
                          <th className="pb-2 font-semibold">Client</th>
                          <th className="pb-2 font-semibold">Téléphone</th>
                          <th className="pb-2 font-semibold">Places</th>
                          <th className="pb-2 font-semibold">Montant</th>
                          <th className="pb-2 font-semibold">Statut</th>
                          <th className="pb-2 font-semibold">Réf.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.bookings.map((item) => (
                          <tr key={item.id} className="border-t border-gray-100">
                            <td className="py-2.5 font-medium text-navy">{item.name}</td>
                            <td className="py-2.5 text-gray-600">{item.phone}</td>
                            <td className="py-2.5 text-gray-600">{item.travelers}</td>
                            <td className="py-2.5 font-semibold text-navy">
                              {formatPrice(item.totalPrice)} FCFA
                            </td>
                            <td className="py-2.5 text-xs text-gray-600">
                              {reservationStatusLabel[item.status]}
                            </td>
                            <td className="py-2.5 text-xs text-gold">{item.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un client, un téléphone, une référence..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    filter === item.id
                      ? "bg-gold text-white"
                      : "bg-white text-navy shadow-card"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-card">
              Aucune réservation dans cette vue.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Réf.</th>
                      <th className="px-4 py-3 font-semibold">Client</th>
                      <th className="px-4 py-3 font-semibold">Voyage</th>
                      <th className="px-4 py-3 font-semibold">Départ</th>
                      <th className="px-4 py-3 font-semibold">Places</th>
                      <th className="px-4 py-3 font-semibold">Montant</th>
                      <th className="px-4 py-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => {
                      const open = openId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className="cursor-pointer border-t border-gray-100 align-top hover:bg-gold/[0.04]"
                          onClick={() => setOpenId(open ? "" : item.id)}
                        >
                          <td className="px-4 py-3 text-xs font-bold text-gold">{item.reference}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-navy">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.phone}</p>
                            {open ? (
                              <div className="mt-3 space-y-2 text-xs text-gray-600" onClick={(e) => e.stopPropagation()}>
                                <p>{item.email}</p>
                                <p>
                                  Voyage inscrit : <strong>{item.destinationTitle}</strong>
                                </p>
                                <p>
                                  Date du voyage :{" "}
                                  <strong>{formatAdminDate(item.departureDate)}</strong>
                                </p>
                                {item.notes ? <p>Note client : {item.notes}</p> : null}
                                <p>
                                  Payé :{" "}
                                  {formatPrice(isPaidReservation(item.status) ? item.totalPrice : 0)}{" "}
                                  FCFA
                                </p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <a
                                    href={`tel:${item.phone}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 font-semibold text-navy"
                                  >
                                    <Phone className="h-3 w-3" />
                                    Appeler
                                  </a>
                                  <a
                                    href={`/admin?c=clients&id=${encodeURIComponent(clientKey(item.email, item.phone))}`}
                                    className="rounded-lg border border-gray-200 px-2.5 py-1 font-semibold text-navy"
                                  >
                                    Fiche client
                                  </a>
                                  {item.status === "awaiting_contact" && (
                                    <button
                                      type="button"
                                      onClick={() => void updateStatus(item.id, "payment_received")}
                                      className="btn-gold px-3 py-1"
                                    >
                                      Confirmer le paiement
                                    </button>
                                  )}
                                  {item.status === "payment_received" && (
                                    <button
                                      type="button"
                                      onClick={() => void updateStatus(item.id, "confirmed")}
                                      className="btn-gold px-3 py-1"
                                    >
                                      Confirmer le voyage
                                    </button>
                                  )}
                                  {item.status !== "cancelled" && item.status !== "confirmed" && (
                                    <button
                                      type="button"
                                      onClick={() => void updateStatus(item.id, "cancelled")}
                                      className="rounded-lg border border-gray-200 px-2.5 py-1 font-semibold text-red-600"
                                    >
                                      Annuler
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-navy">{item.destinationTitle}</p>
                            <p className="text-[11px] text-gray-400">{item.country}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-navy">{formatAdminDate(item.departureDate)}</p>
                            <p className="text-[11px] text-gray-400">Date du voyage</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.travelers}</td>
                          <td className="px-4 py-3 font-semibold text-navy">
                            {formatPrice(item.totalPrice)} FCFA
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(item.status)}`}>
                              {reservationStatusLabel[item.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-white px-4 py-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
    </article>
  );
}
