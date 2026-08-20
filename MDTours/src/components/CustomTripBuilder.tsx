"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Building2,
  Calendar,
  Car,
  Check,
  MapPin,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { formatPrice } from "@/data/home";
import {
  activityPrice,
  buildPersonalizedQuote,
  nightsBetween,
  travelerCount,
} from "@/lib/personalizedQuote";
import type {
  AccommodationType,
  PersonalizedCatalog,
  VehicleType,
} from "@/lib/types";

function Stepper({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <div>
        <p className="font-semibold text-navy">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Retirer : ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy hover:border-gold hover:text-gold"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-lg font-bold text-navy">{value}</span>
        <button
          type="button"
          aria-label={`Ajouter : ${label}`}
          onClick={() => onChange(Math.min(20, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy hover:border-gold hover:text-gold"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CustomTripBuilder() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [catalog, setCatalog] = useState<PersonalizedCatalog | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adults, setAdults] = useState(2);
  const [childrenUnder12, setChildrenUnder12] = useState(0);
  const [childrenUnder16, setChildrenUnder16] = useState(0);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [accommodation, setAccommodation] = useState<AccommodationType | "">("");
  const [vehicle, setVehicle] = useState<VehicleType | "">("");
  const [cities, setCities] = useState<string[]>([]);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  useEffect(() => {
    fetch("/api/personalized-catalog")
      .then((response) => response.json())
      .then((data: { catalog?: PersonalizedCatalog }) => {
        setCatalog(data.catalog ?? null);
      })
      .catch(() => setCatalog(null));
  }, []);

  const travelers = travelerCount({ adults, childrenUnder12, childrenUnder16 });
  const nights = nightsBetween(departureDate, returnDate);
  const quote = useMemo(() => {
    if (!catalog) {
      return {
        nights: 0,
        vehicleDays: 0,
        travelers: 0,
        accommodation: 0,
        vehicle: 0,
        activities: 0,
        total: 0,
        breakdown: [],
      };
    }
    return buildPersonalizedQuote(catalog, {
      adults,
      childrenUnder12,
      childrenUnder16,
      departureDate,
      returnDate,
      accommodation,
      vehicle,
      activityIds,
    });
  }, [
    catalog,
    adults,
    childrenUnder12,
    childrenUnder16,
    departureDate,
    returnDate,
    accommodation,
    vehicle,
    activityIds,
  ]);

  function toggleCity(id: string) {
    setCities((current) => {
      const selected = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      const allowed = new Set(
        (catalog?.cities ?? [])
          .filter((city) => selected.includes(city.id))
          .flatMap((city) => city.activities.map((activity) => activity.id))
      );
      setActivityIds((ids) => ids.filter((item) => allowed.has(item)));
      return selected;
    });
  }

  function toggleActivity(id: string) {
    setActivityIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      router.push("/connexion?next=/voyage-personnalise");
      return;
    }
    if (travelers < 1) {
      setError("Indiquez au moins un voyageur.");
      return;
    }
    if (!departureDate || !returnDate || !accommodation || !vehicle || cities.length === 0) {
      setError("Complétez les dates, l’hébergement, le véhicule et au moins une ville.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/custom-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          adults,
          childrenUnder12,
          childrenUnder16,
          departureDate,
          returnDate,
          accommodation,
          vehicle,
          cities,
          activityIds,
          suggestion,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        request?: { id: string };
      };
      if (!response.ok || !data.request) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      router.push(`/voyage-personnalise/${data.request.id}`);
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCities = catalog?.cities.filter((city) => cities.includes(city.id)) ?? [];
  const lodgingIcon = { hotel: Building2, residence: BedDouble };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-8">
        <section className="rounded-3xl border border-gray-100 p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">1</p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-navy">
            <Users className="h-5 w-5 text-gold" />
            Voyageurs
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Les tarifs d’activités changent selon l’âge des enfants.
          </p>
          <div className="mt-5 space-y-3">
            <Stepper
              label="Adultes"
              hint="16 ans et plus"
              value={adults}
              onChange={setAdults}
            />
            <Stepper
              label="Enfants de moins de 12 ans"
              hint="Tarif enfant le plus bas"
              value={childrenUnder12}
              onChange={setChildrenUnder12}
            />
            <Stepper
              label="Enfants de moins de 16 ans"
              hint="De 12 à 15 ans"
              value={childrenUnder16}
              onChange={setChildrenUnder16}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">2</p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-navy">
            <Calendar className="h-5 w-5 text-gold" />
            Dates du séjour
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-navy">
              Date de départ
              <input
                required
                type="date"
                min={today}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="text-sm font-medium text-navy">
              Date de retour
              <input
                required
                type="date"
                min={departureDate || today}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
          </div>
          {nights > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {nights} nuit{nights > 1 ? "s" : ""} · {quote.vehicleDays} jour
              {quote.vehicleDays > 1 ? "s" : ""} de véhicule
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">3</p>
          <h2 className="mt-2 text-xl font-bold text-navy">Hébergement</h2>
          <p className="mt-1 text-sm text-gray-500">Hôtel ou résidence meublée.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(catalog?.accommodations ?? []).map((option) => {
              const Icon = lodgingIcon[option.id];
              const selected = accommodation === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccommodation(option.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected ? "border-gold bg-gold/10" : "border-gray-200 hover:border-gold/50"
                  }`}
                >
                  <Icon className="h-6 w-6 text-gold" />
                  <p className="mt-3 font-semibold text-navy">{option.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    {option.description}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-navy">
                    {option.id === "hotel"
                      ? `${formatPrice(option.adultPerNight ?? 0)} FCFA / adulte / nuit`
                      : `${formatPrice(option.nightlyRate ?? 0)} FCFA / nuit`}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">4</p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-navy">
            <Car className="h-5 w-5 text-gold" />
            Véhicule
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(catalog?.vehicles ?? []).map((option) => {
              const selected = vehicle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVehicle(option.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected ? "border-gold bg-gold/10" : "border-gray-200 hover:border-gold/50"
                  }`}
                >
                  <p className="font-semibold text-navy">{option.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{option.description}</p>
                  <p className="mt-3 text-sm font-semibold text-navy">
                    {formatPrice(option.pricePerDay)} FCFA / jour
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">5</p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-navy">
            <MapPin className="h-5 w-5 text-gold" />
            Villes et activités
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choisissez une ou plusieurs villes, puis les activités à y faire. Chaque
            activité a un tarif adulte / -12 ans / -16 ans.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(catalog?.cities ?? []).map((city) => {
              const selected = cities.includes(city.id);
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => toggleCity(city.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected ? "bg-gold text-white" : "bg-gray-100 text-navy hover:bg-gold/15"
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
          </div>

          {selectedCities.length === 0 && (
            <p className="mt-5 text-sm text-gray-500">
              Sélectionnez une ville pour afficher ses activités.
            </p>
          )}

          <div className="mt-6 space-y-6">
            {selectedCities.map((city) => (
              <div key={city.id}>
                <h3 className="font-bold text-navy">{city.name}</h3>
                <div className="mt-3 space-y-3">
                  {city.activities.map((activity) => {
                    const selected = activityIds.includes(activity.id);
                    const amount = activityPrice(activity, {
                      adults,
                      childrenUnder12,
                      childrenUnder16,
                    });
                    return (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => toggleActivity(activity.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-gold bg-gold/10"
                            : "border-gray-200 hover:border-gold/50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-gold bg-gold text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-navy">{activity.name}</span>
                            <span className="text-sm font-semibold text-navy">
                              {formatPrice(amount)} FCFA
                            </span>
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            {activity.description}
                          </span>
                          <span className="mt-2 block text-xs text-gray-500">
                            Adulte {formatPrice(activity.adult)} · -12 ans{" "}
                            {activity.childUnder12 > 0
                              ? formatPrice(activity.childUnder12)
                              : "non proposé"}{" "}
                            · -16 ans {formatPrice(activity.childUnder16)} FCFA
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 p-6 shadow-card">
          <h2 className="text-xl font-bold text-navy">Vos coordonnées</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-navy">
              Nom
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="text-sm font-medium text-navy">
              Téléphone
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="text-sm font-medium text-navy sm:col-span-2">
              Précision (optionnel)
              <textarea
                rows={3}
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Allergies, rythme, envies particulières…"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {!loading && !user && (
          <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
            <a href="/connexion?next=/voyage-personnalise" className="font-semibold text-gold">
              Connectez-vous
            </a>{" "}
            pour enregistrer ce devis. Le total reste visible pendant que vous composez.
          </p>
        )}

        <button type="submit" disabled={saving || travelers < 1} className="btn-gold lg:hidden">
          {saving ? "Enregistrement..." : `Réserver · ${formatPrice(quote.total)} FCFA`}
        </button>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-3xl bg-navy p-6 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Votre devis
          </p>
          <p className="mt-3 text-3xl font-bold">
            {formatPrice(quote.total)}{" "}
            <span className="text-base font-medium text-white/70">FCFA</span>
          </p>
          <p className="mt-1 text-xs text-white/60">
            {catalog?.note || "Total estimé, mis à jour à chaque choix."}
          </p>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4 text-white/80">
              <dt>Voyageurs</dt>
              <dd>{travelers}</dd>
            </div>
            <div className="flex justify-between gap-4 text-white/80">
              <dt>Nuits</dt>
              <dd>{nights}</dd>
            </div>
            {quote.breakdown.map((line) => (
              <div key={line.label} className="flex justify-between gap-4 text-white/80">
                <dt className="pr-2">{line.label}</dt>
                <dd className="shrink-0">{formatPrice(line.amount)}</dd>
              </div>
            ))}
          </dl>
          <button
            type="submit"
            disabled={saving || travelers < 1}
            className="btn-gold mt-6 hidden w-full lg:inline-flex"
          >
            {saving ? "Enregistrement..." : "Enregistrer ce voyage"}
          </button>
          <p className="mt-3 text-xs text-white/50">
            Le montant s’affiche tout de suite. Un récapitulatif peut aussi être
            envoyé par e-mail après enregistrement.
          </p>
        </div>
      </aside>
    </form>
  );
}
