"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Minus, Plus, Search, Users } from "lucide-react";
import { destinationOptions } from "@/data/home";
import type { Destination } from "@/lib/types";

export default function SearchBar() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [voyageurs, setVoyageurs] = useState(1);

  const [options, setOptions] = useState<string[]>(destinationOptions);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    fetch("/api/destinations")
      .then((response) => response.json())
      .then((data: { destinations?: Destination[] }) => {
        const titles = (data.destinations ?? []).map((item) => item.title);
        if (titles.length > 0) {
          setOptions([...new Set([...titles, ...destinationOptions])]);
        }
      })
      .catch(() => undefined);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    if (date) params.set("date", date);
    params.set("voyageurs", String(voyageurs));
    router.push(`/?${params.toString()}#voyages`);
  }

  return (
    <form
      id="reserver"
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl"
    >
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-search sm:grid-cols-2 lg:grid-cols-[1.2fr_1.1fr_0.9fr_auto]">
        <label className="flex cursor-text items-center gap-3 border-b border-gray-100 px-5 py-4 sm:border-b-0 sm:border-r lg:py-5">
          <MapPin className="h-5 w-5 shrink-0 text-gold" strokeWidth={2} />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Destination
            </span>
            <input
              name="destination"
              list="destination-options"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Où voulez-vous aller ?"
              autoComplete="off"
              className="mt-0.5 w-full bg-transparent text-sm font-medium text-navy outline-none placeholder:text-gray-400"
            />
            <datalist id="destination-options">
              {options.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </span>
        </label>

        <label className="flex cursor-text items-center gap-3 border-b border-gray-100 px-5 py-4 sm:border-b-0 sm:border-r lg:py-5">
          <Calendar className="h-5 w-5 shrink-0 text-gold" strokeWidth={2} />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Date de départ
            </span>
            <input
              type="date"
              name="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-sm font-medium text-navy outline-none"
            />
          </span>
        </label>

        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 sm:border-b-0 lg:border-r lg:py-5">
          <Users className="h-5 w-5 shrink-0 text-gold" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Voyageurs
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <button
                type="button"
                aria-label="Retirer un voyageur"
                onClick={() => setVoyageurs((n) => Math.max(1, n - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-navy transition-colors hover:border-gold hover:text-gold"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                name="voyageurs"
                min={1}
                max={20}
                value={voyageurs}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isNaN(value)) return;
                  setVoyageurs(Math.min(20, Math.max(1, value)));
                }}
                className="w-12 bg-transparent text-center text-sm font-medium text-navy outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Ajouter un voyageur"
                onClick={() => setVoyageurs((n) => Math.min(20, n + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-navy transition-colors hover:border-gold hover:text-gold"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-stretch p-3 sm:col-span-2 lg:col-span-1 lg:p-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-gold-dark lg:min-w-[210px] lg:rounded-lg"
          >
            <Search className="h-4 w-4" />
            Rechercher un voyage
          </button>
        </div>
      </div>
    </form>
  );
}
