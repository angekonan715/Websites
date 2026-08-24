"use client";

import { useEffect, useState } from "react";
import type { Testimonial } from "@/lib/types";

export default function GuestFeedback() {
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((response) => response.json())
      .then((data: { testimonials?: Testimonial[] }) => {
        setItems((data.testimonials ?? []).slice(0, 6));
      })
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="bg-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="section-kicker">Témoignages</p>
        <h2 className="section-title mt-3">La parole des voyageurs</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <blockquote
              key={item.id}
              className="flex flex-col border border-cream-dark bg-white p-7"
            >
              <p className="flex-1 font-editorial text-xl leading-relaxed text-navy">
                “{item.message}”
              </p>
              <footer className="mt-6">
                <p className="text-sm font-semibold text-navy">{item.authorName}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-gold">
                  {item.tripTitle}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href="/historique#temoignages" className="btn-outline-navy">
            Lire plus d’avis
          </a>
        </div>
      </div>
    </section>
  );
}
