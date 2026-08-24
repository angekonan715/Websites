"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { MegaMenuKey, MegaMenuRegion } from "@/lib/types";

export default function NavMegaMenu({
  menu,
  sidebarTitle,
  onNavigate,
  regions: regionsProp,
}: {
  menu: MegaMenuKey;
  sidebarTitle: string;
  onNavigate?: () => void;
  regions?: MegaMenuRegion[];
}) {
  const [fetched, setFetched] = useState<MegaMenuRegion[]>([]);
  const [activeId, setActiveId] = useState(regionsProp?.[0]?.id ?? "");

  useEffect(() => {
    if (regionsProp) {
      setActiveId((current) =>
        regionsProp.some((item) => item.id === current)
          ? current
          : regionsProp[0]?.id ?? ""
      );
      return;
    }
    let cancelled = false;
    fetch("/api/mega-menus")
      .then((response) => response.json())
      .then((data: { menus?: { destinations?: MegaMenuRegion[]; voyages?: MegaMenuRegion[] } }) => {
        if (cancelled) return;
        const items = data.menus?.[menu] ?? [];
        setFetched(items);
        setActiveId(items[0]?.id ?? "");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [menu, regionsProp]);

  const regions = regionsProp ?? fetched;

  const region = regions.find((item) => item.id === activeId) ?? regions[0];
  if (!region) {
    return (
      <div className="bg-white px-6 py-10 text-sm text-navy/60">
        {menu === "destinations"
          ? "Aucun pays / région pour le moment."
          : "Aucun voyage pour le moment."}
      </div>
    );
  }

  return (
    <div className="grid min-h-[22rem] lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="bg-[#F7F3EA] px-5 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          {sidebarTitle}
        </p>
        <nav className="mt-4 space-y-1">
          {regions.map((item) => {
            const active = item.id === region.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveId(item.id)}
                onFocus={() => setActiveId(item.id)}
                onClick={() => setActiveId(item.id)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "border-l-2 border-gold bg-white font-semibold text-navy"
                    : "border-l-2 border-transparent text-navy/75 hover:bg-white/70 hover:text-navy"
                }`}
              >
                {item.label}
                <ChevronRight
                  className={`h-4 w-4 ${active ? "text-gold" : "text-navy/30"}`}
                />
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="bg-white">
        <div className="relative h-32 overflow-hidden sm:h-40">
          <Image
            src={region.image}
            alt={region.label}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 70vw"
          />
          <div className="absolute inset-0 bg-navy/45" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
            <p className="font-editorial text-3xl font-semibold text-white sm:text-4xl">
              {region.label}
            </p>
            <p className="mt-1 text-sm text-white/80">{region.tagline}</p>
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <a
            href={region.href}
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold"
          >
            Explorer {region.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          {region.destinations.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {region.destinations.map((destination) => (
                <a
                  key={destination.href + destination.label}
                  href={destination.href}
                  onClick={onNavigate}
                  className="group relative overflow-hidden rounded-sm bg-navy shadow-card"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={destination.image || region.image}
                      alt={destination.label}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 18vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
                    <p className="absolute inset-x-0 bottom-0 p-2.5 font-editorial text-sm font-semibold leading-snug text-white sm:p-3 sm:text-base">
                      {destination.label}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-navy/60">
              {menu === "destinations"
                ? "Aucun lieu dans cette région pour le moment."
                : "Aucun voyage disponible pour le moment."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
