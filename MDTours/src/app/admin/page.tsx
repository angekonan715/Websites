"use client";

import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import AdminCustomTrips from "@/components/AdminCustomTrips";
import AdminHistory from "@/components/AdminHistory";
import AdminPersonalizedCatalog from "@/components/AdminPersonalizedCatalog";
import AdminReservations from "@/components/AdminReservations";
import AdminTestimonials from "@/components/AdminTestimonials";
import AdminTrips from "@/components/AdminTrips";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header variant="solid" />
        <p className="px-6 py-16 text-sm text-gray-500">Chargement...</p>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header variant="solid" />
        <p className="px-6 py-16 text-sm text-navy">
          Accès réservé aux administrateurs.{" "}
          <a href="/connexion?next=/admin" className="font-semibold text-gold">
            Connectez-vous
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Espace admin</h1>
        <p className="mt-2 text-sm text-gray-500">
          Gérez les voyages groupés, les demandes personnalisées, l’historique
          photos/vidéos, et les avis clients.
        </p>
        <a href="/" className="btn-gold mt-4 inline-flex px-4 py-2 text-xs">
          Voir le site (vue client)
        </a>

        <AdminTrips />

        <div className="mt-10">
          <AdminPersonalizedCatalog />
        </div>

        <div className="mt-10">
          <AdminCustomTrips />
        </div>

        <div className="mt-10">
          <AdminReservations />
        </div>

        <div className="mt-10">
          <AdminHistory />
        </div>

        <AdminTestimonials />
      </div>
    </main>
  );
}
