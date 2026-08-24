"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Menu, MessageCircle, X } from "lucide-react";
import Logo from "./Logo";
import AuthMenu from "./AuthMenu";
import AdminViewSwitcher from "./AdminViewSwitcher";
import CampaignTicker from "./CampaignTicker";
import NavMegaMenu from "./NavMegaMenu";
import { agencyContact, navLinks } from "@/data/home";
import { defaultMegaMenus } from "@/lib/megaMenus";
import type { MegaMenuKey, MegaMenuRegion, MegaMenus } from "@/lib/types";

interface HeaderProps {
  variant?: "overlay" | "solid";
  initialMenus?: MegaMenus;
}

export default function Header({ variant = "overlay", initialMenus }: HeaderProps) {
  const solid = variant === "solid";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<MegaMenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState<MegaMenuKey | null>(null);
  const [menus, setMenus] = useState<MegaMenus>(initialMenus ?? defaultMegaMenus);

  useEffect(() => {
    fetch("/api/mega-menus")
      .then((response) => response.json())
      .then((data: { menus?: MegaMenus }) => {
        if (data.menus) setMenus(data.menus);
      })
      .catch(() => undefined);
  }, []);

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

  function closeMenus() {
    setOpen(false);
    setMegaOpen(null);
    setMobileOpen(null);
  }

  function megaKeyFor(label: string): MegaMenuKey | null {
    if (label === "Destinations") return "destinations";
    if (label === "Nos Voyages") return "voyages";
    return null;
  }

  function renderMobileRegions(regions: MegaMenuRegion[]) {
    return (
      <div className="pb-3 pl-1">
        {regions.map((region) => (
          <div key={region.id} className="mb-3">
            <a
              href={region.href}
              onClick={closeMenus}
              className="block py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold"
            >
              {region.label}
            </a>
            {region.destinations.map((destination) => (
              <a
                key={destination.href + destination.label}
                href={destination.href}
                onClick={closeMenus}
                className="flex items-center gap-2.5 py-1.5 pl-1 text-sm text-white/80 hover:text-gold"
              >
                {destination.image ? (
                  <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-sm">
                    <Image
                      src={destination.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </span>
                ) : null}
                {destination.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    );
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
      <div className="relative" onMouseLeave={() => setMegaOpen(null)}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-6 sm:pb-5 sm:pt-[max(1.25rem,env(safe-area-inset-top))] lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-4 xl:flex xl:gap-6 2xl:gap-7">
            {navLinks.map((link) => {
              const mega = megaKeyFor(link.label);
              if (mega) {
                const active = isActive(link.href) || megaOpen === mega;
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setMegaOpen(mega)}
                  >
                    <a
                      href={link.href}
                      className={`relative inline-flex items-center gap-1 whitespace-nowrap py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 transition-colors hover:text-gold ${
                        active ? "text-white" : ""
                      }`}
                    >
                      {link.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                      {active ? (
                        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gold" />
                      ) : null}
                    </a>
                  </div>
                );
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onMouseEnter={() => setMegaOpen(null)}
                  className={`relative whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 transition-colors hover:text-gold ${
                    isActive(link.href) ? "text-white" : ""
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-1.5 left-0 h-0.5 w-full bg-gold" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <AuthMenu />
            <a
              href={`https://wa.me/${agencyContact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:border-gold hover:text-gold sm:h-10 sm:w-10"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="/voyages"
              className="btn-gold hidden px-5 py-2.5 md:inline-flex"
            >
              Voir les voyages
            </a>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 text-white sm:h-10 sm:w-10 xl:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {megaOpen ? (
          <div className="absolute left-0 right-0 top-full z-[70] hidden border-t border-gold/40 shadow-2xl xl:block">
            <div className="mx-auto max-w-7xl overflow-hidden bg-white">
              <NavMegaMenu
                key={megaOpen}
                menu={megaOpen}
                regions={menus[megaOpen]}
                sidebarTitle={megaOpen === "voyages" ? "Nos voyages" : "Régions / pays"}
                onNavigate={() => setMegaOpen(null)}
              />
            </div>
          </div>
        ) : null}
      </div>

      {open && (
        <div className="max-h-[min(80vh,36rem)] overflow-y-auto border-t border-white/10 bg-navy px-4 py-4 sm:px-6 xl:hidden">
          {navLinks.map((link) => {
            const mega = megaKeyFor(link.label);
            if (mega) {
              const expanded = mobileOpen === mega;
              return (
                <div key={link.label} className="py-1">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(expanded ? null : mega)}
                    className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-white"
                  >
                    {link.label}
                    <ChevronDown
                      className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expanded ? renderMobileRegions(menus[mega]) : null}
                </div>
              );
            }
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenus}
                className="block py-2.5 text-sm font-medium text-white hover:text-gold"
              >
                {link.label}
              </a>
            );
          })}
          <a
            href="/voyages"
            onClick={closeMenus}
            className="btn-gold mt-4 w-full md:hidden"
          >
            Voir les voyages
          </a>
        </div>
      )}
    </header>
  );
}
