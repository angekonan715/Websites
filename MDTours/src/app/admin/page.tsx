"use client";

import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import AdminWorkspace from "@/components/AdminWorkspace";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F5F8]">
        <Header variant="solid" />
        <p className="px-6 py-16 text-sm text-gray-500">Chargement...</p>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-[#F4F5F8]">
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
    <main className="min-h-screen bg-[#F4F5F8]">
      <Header variant="solid" />
      <AdminWorkspace />
    </main>
  );
}
