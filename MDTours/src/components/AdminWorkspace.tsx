"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Clock3,
  KeyRound,
  LayoutGrid,
  Link2,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Plane,
  Route,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import AdminAbout from "@/components/AdminAbout";
import AdminCampaigns from "@/components/AdminCampaigns";
import AdminClients from "@/components/AdminClients";
import AdminCustomTrips from "@/components/AdminCustomTrips";
import AdminHistory from "@/components/AdminHistory";
import AdminPassword from "@/components/AdminPassword";
import AdminPersonalizedCatalog from "@/components/AdminPersonalizedCatalog";
import AdminReservations from "@/components/AdminReservations";
import AdminShareLinks from "@/components/AdminShareLinks";
import AdminTestimonials from "@/components/AdminTestimonials";
import AdminTrips from "@/components/AdminTrips";
import {
  adminCategories,
  adminCategoryGroups,
  getAdminCategory,
  type AdminCategoryId,
} from "@/lib/adminNav";

const icons = {
  voyages: Plane,
  personnalise: Route,
  reservations: CalendarCheck,
  clients: Users,
  campagnes: Megaphone,
  liens: Link2,
  "a-propos": BookOpen,
  historique: Clock3,
  temoignages: MessageSquareQuote,
  "mot-de-passe": KeyRound,
};

export default function AdminWorkspace() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-gray-500">Chargement...</p>}>
      <AdminWorkspaceInner />
    </Suspense>
  );
}

function AdminWorkspaceInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("c");
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<AdminCategoryId, number>>>({});

  const category = getAdminCategory(categoryId);

  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      try {
        const [trips, custom, reservations, records, campaigns, shareLinks, history, testimonials] =
          await Promise.all([
            fetch("/api/destinations").then((r) => r.json()),
            fetch("/api/custom-trips").then((r) => r.json()),
            fetch("/api/reservations").then((r) => r.json()),
            fetch("/api/admin/records").then((r) => r.json()),
            fetch("/api/campaigns").then((r) => r.json()),
            fetch("/api/share-links").then((r) => r.json()),
            fetch("/api/history").then((r) => r.json()),
            fetch("/api/testimonials").then((r) => r.json()),
          ]);
        if (cancelled) return;
        setCounts({
          voyages: trips.destinations?.length ?? 0,
          personnalise: custom.requests?.length ?? 0,
          reservations: reservations.reservations?.length ?? 0,
          clients: records.clients?.length ?? 0,
          campagnes: campaigns.campaigns?.length ?? 0,
          liens: shareLinks.links?.length ?? 0,
          historique: history.trips?.length ?? 0,
          temoignages: testimonials.testimonials?.length ?? 0,
        });
      } catch {
        if (!cancelled) setCounts({});
      }
    }
    void loadCounts();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function selectCategory(id: string | null) {
    router.push(id ? `/admin?c=${encodeURIComponent(id)}` : "/admin");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const grouped = useMemo(
    () =>
      adminCategoryGroups.map((group) => ({
        ...group,
        items: adminCategories.filter((item) => item.group === group.id),
      })),
    []
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1440px]">
      <aside className="hidden w-72 shrink-0 bg-navy lg:block">
        <div className="sticky top-0 flex max-h-screen flex-col overflow-y-auto px-4 py-8">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            Administration
          </p>
          <h1 className="mt-2 px-3 text-lg font-bold text-white">Espace admin</h1>
          <p className="mt-1 px-3 text-xs text-white/55">
            {user?.name ? `Connecté en tant que ${user.name}` : "MD Tours"}
          </p>

          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={`mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              !category
                ? "bg-gold text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Vue d’ensemble
          </button>

          <nav className="mt-6 space-y-6">
            {grouped.map((group) => (
              <div key={group.id}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const Icon = icons[item.id];
                    const active = category?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectCategory(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-gold text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 font-medium">{item.label}</span>
                        {counts[item.id] !== undefined ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              active ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
                            }`}
                          >
                            {counts[item.id]}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <a
            href="/"
            className="mt-8 px-3 text-xs font-semibold text-gold hover:text-gold-light"
          >
            Voir le site public →
          </a>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-navy/50"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col overflow-y-auto bg-navy px-4 py-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <p className="text-sm font-bold text-white">Catégories</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => selectCategory(null)}
              className={`mb-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                !category ? "bg-gold text-white" : "text-white/75 hover:bg-white/10"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Vue d’ensemble
            </button>
            {grouped.map((group) => (
              <div key={group.id} className="mb-5">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const Icon = icons[item.id];
                    const active = category?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectCategory(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                          active ? "bg-gold text-white" : "text-white/75 hover:bg-white/10"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1 bg-[#F4F5F8] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-navy shadow-sm"
          >
            <Menu className="h-4 w-4" />
            Catégories
          </button>
          {category ? (
            <p className="truncate text-sm font-medium text-navy">{category.label}</p>
          ) : null}
        </div>

        {category ? (
          <section>
            <button
              type="button"
              onClick={() => selectCategory(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Vue d’ensemble
            </button>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
              {adminCategoryGroups.find((group) => group.id === category.group)?.label}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{category.label}</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">{category.description}</p>
            <div className="mt-8">{renderCategory(category.id)}</div>
          </section>
        ) : (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
              Administration
            </p>
            <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
              {user?.name ? `Bonjour, ${user.name.split(" ")[0]}` : "Espace admin"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Choisissez une catégorie pour afficher son contenu et faire vos modifications.
            </p>

            <div className="mt-8 space-y-8">
              {grouped.map((group) => (
                <div key={group.id}>
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                    {group.label}
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => {
                      const Icon = icons[item.id];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectCategory(item.id)}
                          className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold">
                              <Icon className="h-5 w-5" />
                            </span>
                            {counts[item.id] !== undefined ? (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-navy">
                                {counts[item.id]}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-4 text-base font-bold text-navy">{item.label}</p>
                          <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-500">
                            {item.description}
                          </p>
                          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-gold">
                            Ouvrir
                            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function renderCategory(id: AdminCategoryId) {
  switch (id) {
    case "voyages":
      return <AdminTrips />;
    case "personnalise":
      return (
        <div className="space-y-4">
          <AdminPersonalizedCatalog />
          <AdminCustomTrips />
        </div>
      );
    case "reservations":
      return <AdminReservations />;
    case "clients":
      return <AdminClients />;
    case "campagnes":
      return <AdminCampaigns />;
    case "liens":
      return <AdminShareLinks />;
    case "a-propos":
      return <AdminAbout />;
    case "historique":
      return <AdminHistory />;
    case "temoignages":
      return <AdminTestimonials />;
    case "mot-de-passe":
      return <AdminPassword />;
  }
}
