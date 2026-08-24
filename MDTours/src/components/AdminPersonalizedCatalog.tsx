"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/data/home";
import type { PersonalizedActivity, PersonalizedCatalog } from "@/lib/types";

type ActivityForm = {
  name: string;
  description: string;
  adult: string;
  childUnder12: string;
  childUnder16: string;
};

function ActivityEditForm({
  form,
  setForm,
  onCancel,
  onSave,
}: {
  form: ActivityForm;
  setForm: (value: ActivityForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-2">
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nom de l’activité"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold sm:col-span-2"
      />
      <input
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold sm:col-span-2"
      />
      <input
        type="number"
        min={0}
        value={form.adult}
        onChange={(e) => setForm({ ...form, adult: e.target.value })}
        placeholder="Prix adulte"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <input
        type="number"
        min={0}
        value={form.childUnder12}
        onChange={(e) => setForm({ ...form, childUnder12: e.target.value })}
        placeholder="Prix -12 ans"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <input
        type="number"
        min={0}
        value={form.childUnder16}
        onChange={(e) => setForm({ ...form, childUnder16: e.target.value })}
        placeholder="Prix -16 ans"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <div className="flex gap-2 sm:col-span-2">
        <button type="button" onClick={onSave} className="btn-gold px-4 py-2 text-xs">
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function AdminPersonalizedCatalog() {
  const [catalog, setCatalog] = useState<PersonalizedCatalog | null>(null);
  const [cityName, setCityName] = useState("");
  const [cityId, setCityId] = useState("");
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [adult, setAdult] = useState("");
  const [childUnder12, setChildUnder12] = useState("");
  const [childUnder16, setChildUnder16] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingCityId, setEditingCityId] = useState("");
  const [editingCityName, setEditingCityName] = useState("");
  const [editingActivityId, setEditingActivityId] = useState("");
  const [editForm, setEditForm] = useState<ActivityForm>({
    name: "",
    description: "",
    adult: "",
    childUnder12: "",
    childUnder16: "",
  });

  async function load() {
    const response = await fetch("/api/personalized-catalog");
    const data = (await response.json()) as { catalog?: PersonalizedCatalog };
    setCatalog(data.catalog ?? null);
    if (data.catalog?.cities[0] && !cityId) setCityId(data.catalog.cities[0].id);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(payload: Record<string, unknown>) {
    setError("");
    setMessage("");
    const response = await fetch("/api/personalized-catalog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      error?: string;
      catalog?: PersonalizedCatalog;
    };
    if (!response.ok) {
      setError(data.error ?? "Enregistrement impossible.");
      return;
    }
    setCatalog(data.catalog ?? null);
    setMessage("Catalogue mis à jour.");
    setEditingActivityId("");
    setEditingCityId("");
  }

  function startEditActivity(activity: PersonalizedActivity) {
    setEditingActivityId(activity.id);
    setEditingCityId("");
    setEditForm({
      name: activity.name,
      description: activity.description,
      adult: String(activity.adult),
      childUnder12: String(activity.childUnder12),
      childUnder16: String(activity.childUnder16),
    });
  }

  async function addCity(event: FormEvent) {
    event.preventDefault();
    await save({ cityName });
    setCityName("");
  }

  async function addActivity(event: FormEvent) {
    event.preventDefault();
    await save({
      activity: {
        cityId,
        name: activityName,
        description: activityDescription,
        adult: Number(adult || 0),
        childUnder12: Number(childUnder12 || 0),
        childUnder16: Number(childUnder16 || 0),
      },
    });
    setActivityName("");
    setActivityDescription("");
    setAdult("");
    setChildUnder12("");
    setChildUnder16("");
  }

  async function savePrices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalog) return;
    const form = new FormData(event.currentTarget);
    const accommodations = catalog.accommodations.map((item) => {
      if (item.id === "hotel") {
        return {
          ...item,
          adultPerNight: Number(form.get("hotelAdult") ?? item.adultPerNight),
          childUnder12PerNight: Number(
            form.get("hotelChild12") ?? item.childUnder12PerNight
          ),
          childUnder16PerNight: Number(
            form.get("hotelChild16") ?? item.childUnder16PerNight
          ),
        };
      }
      return {
        ...item,
        nightlyRate: Number(form.get("residenceNight") ?? item.nightlyRate),
        extraPersonPerNight: Number(
          form.get("residenceExtra") ?? item.extraPersonPerNight
        ),
      };
    });
    const vehicles = catalog.vehicles.map((item) => ({
      ...item,
      pricePerDay: Number(form.get(`vehicle-${item.id}`) ?? item.pricePerDay),
    }));
    await save({ accommodations, vehicles });
  }

  if (!catalog) {
    return (
      <section className="mb-12">
        <p className="text-sm text-gray-500">Chargement du catalogue...</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-lg font-bold text-navy">Tarifs du voyage personnalisé</h3>
      <p className="mt-1 text-sm text-gray-500">
        Modifiez les villes, les activités et les tarifs. Les changements
        apparaissent tout de suite sur le voyage personnalisé.
      </p>

      <form
        onSubmit={(event) => void savePrices(event)}
        className="mt-5 space-y-4 rounded-2xl bg-white p-5 shadow-card"
      >
        <h3 className="font-semibold text-navy">Hébergement & véhicules</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-navy">
            Hôtel / adulte / nuit
            <input
              name="hotelAdult"
              type="number"
              min={0}
              defaultValue={
                catalog.accommodations.find((item) => item.id === "hotel")
                  ?.adultPerNight ?? 0
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-navy">
            Hôtel / -12 ans / nuit
            <input
              name="hotelChild12"
              type="number"
              min={0}
              defaultValue={
                catalog.accommodations.find((item) => item.id === "hotel")
                  ?.childUnder12PerNight ?? 0
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-navy">
            Hôtel / -16 ans / nuit
            <input
              name="hotelChild16"
              type="number"
              min={0}
              defaultValue={
                catalog.accommodations.find((item) => item.id === "hotel")
                  ?.childUnder16PerNight ?? 0
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-navy">
            Résidence / nuit
            <input
              name="residenceNight"
              type="number"
              min={0}
              defaultValue={
                catalog.accommodations.find((item) => item.id === "residence")
                  ?.nightlyRate ?? 0
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-navy">
            Résidence / pers. extra / nuit
            <input
              name="residenceExtra"
              type="number"
              min={0}
              defaultValue={
                catalog.accommodations.find((item) => item.id === "residence")
                  ?.extraPersonPerNight ?? 0
              }
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {catalog.vehicles.map((item) => (
            <label key={item.id} className="text-xs font-medium text-navy">
              {item.label} / jour
              <input
                name={`vehicle-${item.id}`}
                type="number"
                min={0}
                defaultValue={item.pricePerDay}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
        <button type="submit" className="btn-gold px-4 py-2 text-xs">
          Enregistrer les tarifs
        </button>
      </form>

      <form
        onSubmit={(event) => void addCity(event)}
        className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card sm:flex-row"
      >
        <input
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          placeholder="Nouvelle ville, ex. Kumasi"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button type="submit" className="btn-gold px-4 py-2 text-xs">
          Ajouter la ville
        </button>
      </form>

      <form
        onSubmit={(event) => void addActivity(event)}
        className="mt-5 grid gap-3 rounded-2xl bg-white p-5 shadow-card sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-navy">
          Ville
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          >
            {catalog.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-navy">
          Activité
          <input
            required
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Description
          <input
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Prix adulte
          <input
            required
            type="number"
            min={0}
            value={adult}
            onChange={(e) => setAdult(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Prix -12 ans
          <input
            type="number"
            min={0}
            value={childUnder12}
            onChange={(e) => setChildUnder12(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Prix -16 ans
          <input
            type="number"
            min={0}
            value={childUnder16}
            onChange={(e) => setChildUnder16(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <button type="submit" className="btn-gold sm:col-span-2 w-fit px-4 py-2 text-xs">
          Ajouter l’activité
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-700">{message}</p>}

      <div className="mt-6 space-y-4">
        {catalog.cities.map((city) => (
          <article key={city.id} className="rounded-2xl bg-white p-5 shadow-card">
            {editingCityId === city.id ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={editingCityName}
                  onChange={(e) => setEditingCityName(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={() =>
                    void save({
                      updateCity: { id: city.id, name: editingCityName },
                    })
                  }
                  className="btn-gold px-4 py-2 text-xs"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCityId("")}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-navy">{city.name}</h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCityId(city.id);
                      setEditingCityName(city.name);
                      setEditingActivityId("");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier la ville
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Supprimer ${city.name} et toutes ses activités ?`)) {
                        void save({ deleteCityId: city.id });
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            )}
            <ul className="mt-3 space-y-3">
              {city.activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  {editingActivityId === activity.id ? (
                    <ActivityEditForm
                      form={editForm}
                      setForm={setEditForm}
                      onCancel={() => setEditingActivityId("")}
                      onSave={() =>
                        void save({
                          activity: {
                            id: activity.id,
                            name: editForm.name,
                            description: editForm.description,
                            adult: Number(editForm.adult || 0),
                            childUnder12: Number(editForm.childUnder12 || 0),
                            childUnder16: Number(editForm.childUnder16 || 0),
                          },
                        })
                      }
                    />
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-navy">{activity.name}</p>
                        {activity.description ? (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {activity.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-gray-500">
                          Adulte {formatPrice(activity.adult)} · -12 ans{" "}
                          {formatPrice(activity.childUnder12)} · -16 ans{" "}
                          {formatPrice(activity.childUnder16)}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditActivity(activity)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gold"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => void save({ deleteActivityId: activity.id })}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
