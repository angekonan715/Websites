"use client";

import { usePathname } from "next/navigation";
import { Shield, Store } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function AdminViewSwitcher() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (user?.role !== "admin") return null;

  const adminView = pathname.startsWith("/admin");

  return (
    <div className="flex items-center justify-center gap-2 border-b border-white/15 bg-black/25 px-4 py-2 backdrop-blur-sm">
      <p className="hidden text-[11px] font-medium text-white/80 sm:block">
        Mode administrateur
      </p>
      <div className="flex overflow-hidden rounded-full border border-white/30 bg-white/10 p-0.5">
        <a
          href="/"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
            adminView
              ? "text-white/80 hover:text-white"
              : "bg-gold text-white"
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          Vue client
        </a>
        <a
          href="/admin"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
            adminView
              ? "bg-gold text-white"
              : "text-white/80 hover:text-white"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          Vue admin
        </a>
      </div>
    </div>
  );
}
