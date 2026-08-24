"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Phone, Search } from "lucide-react";
import { formatPrice } from "@/data/home";
import { downloadCsv, formatAdminDate } from "@/lib/csv";
import type { ClientRecord } from "@/lib/types";

export default function AdminClients() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id") ?? "";
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch("/api/admin/records");
    const data = (await response.json()) as { clients?: ClientRecord[] };
    setClients(data.clients ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const selected = clients.find((item) => item.id === openId);
    setNotes(selected?.notes ?? "");
    setNotice("");
  }, [openId, clients]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((item) =>
      [
        item.name,
        item.email,
        item.phone,
        item.currentTripTitle,
        ...item.trips.map((trip) => `${trip.title} ${trip.departureDate}`),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [clients, query]);

  const selected = clients.find((item) => item.id === openId);

  function openClient(id: string) {
    router.push(`/admin?c=clients&id=${encodeURIComponent(id)}`);
  }

  function closeClient() {
    router.push("/admin?c=clients");
  }

  async function saveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selected.id, notes }),
      });
      if (!response.ok) {
        setNotice("Impossible d’enregistrer la note.");
        return;
      }
      setNotice("Note enregistrée dans le dossier client.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    downloadCsv("clients-mdtours.csv", [
      [
        "Nom",
        "Téléphone",
        "Email",
        "Voyages",
        "Confirmés",
        "Voyageurs",
        "Voyage inscrit",
        "Date du voyage",
        "Montant payé",
        "Montant engagé",
        "Dernière activité",
      ],
      ...visible.map((item) => [
        item.name,
        item.phone,
        item.email,
        String(item.bookingCount),
        String(item.confirmedCount),
        String(item.travelersTotal),
        item.currentTripTitle,
        item.currentTripDate,
        String(item.amountPaid),
        String(item.amountEngaged),
        item.lastActivityAt,
      ]),
    ]);
  }

  if (selected) {
    return (
      <section>
        <button
          type="button"
          onClick={closeClient}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tous les clients
        </button>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                Dossier client
              </p>
              <h3 className="mt-1 text-2xl font-bold text-navy">{selected.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{selected.email || "Email non renseigné"}</p>
              <p className="text-sm text-gray-500">{selected.phone || "Téléphone non renseigné"}</p>
            </div>
            {selected.phone ? (
              <a
                href={`tel:${selected.phone}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                Appeler
              </a>
            ) : null}
          </div>

          {selected.currentTripTitle ? (
            <div className="mt-5 rounded-xl bg-gold/10 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
                Voyage inscrit
              </p>
              <p className="mt-1 text-lg font-bold text-navy">{selected.currentTripTitle}</p>
              <p className="mt-0.5 text-sm text-navy/70">
                Date du voyage : {formatAdminDate(selected.currentTripDate)}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Voyages" value={String(selected.bookingCount)} />
            <MiniStat label="Confirmés" value={String(selected.confirmedCount)} />
            <MiniStat label="Payé" value={`${formatPrice(selected.amountPaid)} FCFA`} />
            <MiniStat label="Engagé" value={`${formatPrice(selected.amountEngaged)} FCFA`} />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="border-b border-gray-100 px-5 py-3">
            <h4 className="font-semibold text-navy">Historique des voyages</h4>
          </div>
          {selected.trips.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">Aucun voyage enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Réf.</th>
                    <th className="px-5 py-3 font-semibold">Voyage</th>
                    <th className="px-5 py-3 font-semibold">Départ</th>
                    <th className="px-5 py-3 font-semibold">Places</th>
                    <th className="px-5 py-3 font-semibold">Montant</th>
                    <th className="px-5 py-3 font-semibold">Payé</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.trips.map((trip) => (
                    <tr key={`${trip.kind}-${trip.id}`} className="border-t border-gray-100">
                      <td className="px-5 py-3 text-xs font-bold text-gold">{trip.reference}</td>
                      <td className="px-5 py-3 font-medium text-navy">
                        {trip.title}
                        <span className="mt-0.5 block text-[11px] font-normal text-gray-400">
                          {trip.kind === "custom" ? "Personnalisé" : "Voyage de groupe"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-navy">{formatAdminDate(trip.departureDate)}</p>
                        <p className="text-[11px] text-gray-400">Date du voyage</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{trip.travelers}</td>
                      <td className="px-5 py-3 text-navy">{formatPrice(trip.amount)} FCFA</td>
                      <td className="px-5 py-3 font-semibold text-navy">
                        {formatPrice(trip.paidAmount)} FCFA
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{trip.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={(event) => void saveNotes(event)} className="mt-4 rounded-2xl bg-white p-5 shadow-card">
          <label className="text-sm font-medium text-navy">
            Notes internes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Préférences, relances, observations à conserver dans le dossier..."
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
          {notice ? <p className="mt-2 text-sm text-emerald-700">{notice}</p> : null}
          <button type="submit" disabled={saving} className="btn-gold mt-3 px-4 py-2 text-xs">
            {saving ? "Enregistrement..." : "Enregistrer la note"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Clients" value={String(clients.length)} />
        <MiniStat
          label="Payé au total"
          value={`${formatPrice(clients.reduce((sum, item) => sum + item.amountPaid, 0))} FCFA`}
        />
        <MiniStat
          label="Voyages confirmés"
          value={String(clients.reduce((sum, item) => sum + item.confirmedCount, 0))}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom, un téléphone ou un email..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold"
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-navy"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter CSV
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-card">
          Aucun client enregistré pour le moment.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Téléphone</th>
                  <th className="px-4 py-3 font-semibold">Voyage inscrit</th>
                  <th className="px-4 py-3 font-semibold">Date du voyage</th>
                  <th className="px-4 py-3 font-semibold">Payé</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">
                        {item.currentTripTitle || "Aucun voyage"}
                      </p>
                      {item.trips.length > 1 ? (
                        <p className="text-[11px] text-gray-400">
                          + {item.trips.length - 1} autre
                          {item.trips.length - 1 > 1 ? "s" : ""} voyage
                          {item.trips.length - 1 > 1 ? "s" : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">
                      {item.currentTripDate ? formatAdminDate(item.currentTripDate) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">
                      {formatPrice(item.amountPaid)} FCFA
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openClient(item.id)}
                        className="text-xs font-semibold text-gold hover:underline"
                      >
                        Ouvrir le dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-white px-4 py-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
    </article>
  );
}
