"use client";

import { useState } from "react";
import { CalendarCheck, Compass, Eye, LogOut, Shield, UserRound } from "lucide-react";
import { useAuth } from "./AuthProvider";

interface AuthMenuProps {
  light?: boolean;
}

export default function AuthMenu({ light = false }: AuthMenuProps) {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-lg bg-white/20" />
    );
  }

  if (!user) {
    return (
      <a
        href="/connexion"
        className={
          light
            ? "rounded-lg border border-navy/20 px-4 py-2 text-xs font-semibold text-navy hover:border-gold hover:text-gold"
            : "rounded-lg border-2 border-white/80 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-gold hover:text-gold"
        }
      >
        Connexion
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={
          light
            ? "flex items-center gap-2 rounded-lg border border-navy/20 px-3 py-2 text-xs font-semibold text-navy"
            : "flex items-center gap-2 rounded-lg border-2 border-white/80 px-3 py-2 text-xs font-semibold text-white"
        }
      >
        <UserRound className="h-4 w-4" />
        {user.name.split(" ")[0]}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-search">
          <p className="truncate px-3 py-2 text-xs text-gray-500">{user.email}</p>
          <a
            href="/reservations"
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-gray-50"
          >
            <CalendarCheck className="h-4 w-4 text-gold" />
            Mes réservations
          </a>
          <a
            href="/voyage-personnalise/demandes"
            className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-gray-50"
          >
            <Compass className="h-4 w-4 text-gold" />
            Voyages personnalisés
          </a>
          {user.role === "admin" && (
            <>
              <a
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 text-gold" />
                Vue client
              </a>
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm text-navy hover:bg-gray-50"
              >
                <Shield className="h-4 w-4 text-gold" />
                Vue admin
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-navy hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 text-gold" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
