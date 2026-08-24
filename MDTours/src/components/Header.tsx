"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import Logo from "./Logo";
import AuthMenu from "./AuthMenu";
import AdminViewSwitcher from "./AdminViewSwitcher";
import CampaignTicker from "./CampaignTicker";
import { agencyContact, navLinks } from "@/data/home";

interface HeaderProps {
  variant?: "overlay" | "solid";
}

export default function Header({ variant = "overlay" }: HeaderProps) {
  const solid = variant === "solid";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/voyages") {
      return (
        pathname === "/voyages" ||
        pathname.startsWith("/voyages/") ||
        pathname.startsWith("/voyage-personnalise")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={
        solid
          ? "relative z-50 bg-navy"
          : "absolute left-0 right-0 top-0 z-50"
      }
    >
      <AdminViewSwitcher />
      <CampaignTicker />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-6 sm:pb-5 sm:pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-4 xl:flex xl:gap-6 2xl:gap-7">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="group relative">
                <a
                  href={link.href}
                  className={`relative inline-flex items-center gap-1 whitespace-nowrap py-2 text-[13px] font-medium text-white transition-colors hover:text-gold xl:text-sm ${
                    isActive(link.href) ? "text-white" : ""
                  }`}
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gold" />
                  )}
                </a>
                <div className="invisible absolute left-1/2 top-full z-[60] w-64 -translate-x-1/2 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="rounded-2xl bg-white py-2 shadow-lg">
                    {link.children.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className={`block px-4 py-3 text-sm hover:bg-gold/10 ${
                          pathname === child.href ||
                          pathname.startsWith(`${child.href}/`)
                            ? "font-semibold text-gold"
                            : "text-navy"
                        }`}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className={`relative whitespace-nowrap text-[13px] font-medium text-white transition-colors hover:text-gold xl:text-sm ${
                  isActive(link.href) ? "text-white" : ""
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-gold" />
                )}
              </a>
            )
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <AuthMenu />
          <a
            href={`https://wa.me/${agencyContact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 text-white transition-colors hover:border-gold hover:text-gold sm:h-10 sm:w-10"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <a
            href="/voyages"
            className="btn-gold hidden px-5 py-2.5 text-xs md:inline-flex"
          >
            Réserver maintenant
          </a>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 text-white sm:h-10 sm:w-10 xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[min(80vh,32rem)] overflow-y-auto border-t border-white/10 bg-navy px-4 py-4 sm:px-6 xl:hidden">
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="py-1">
                <p className="py-2 text-sm font-medium text-white">{link.label}</p>
                {link.children.map((child) => (
                  <a
                    key={child.href}
                    href={child.href}
                    onClick={() => setOpen(false)}
                    className="block py-2.5 pl-3 text-sm text-white/80 hover:text-gold"
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            ) : (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm font-medium text-white hover:text-gold"
              >
                {link.label}
              </a>
            )
          )}
          <a
            href="/voyages"
            onClick={() => setOpen(false)}
            className="btn-gold mt-4 w-full md:hidden"
          >
            Réserver maintenant
          </a>
        </div>
      )}
    </header>
  );
}
