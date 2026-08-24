import { agencyContact, navLinks } from "@/data/home";
import NewsletterSignup from "./NewsletterSignup";

export default function Footer() {
  const footerLinks = navLinks.flatMap((link) =>
    link.children?.length ? [link, ...link.children] : [link]
  );

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:grid-cols-2 sm:px-6 sm:py-16 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-editorial text-3xl font-semibold">MD Tours</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            Le guide de confiance. Voyages en petit groupe en Afrique de
            l’Ouest.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Navigation
          </p>
          <div className="mt-4 space-y-2">
            {footerLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="block text-sm text-white/75 hover:text-gold"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Contact
          </p>
          <p className="mt-4 text-sm text-white/80">{agencyContact.phone}</p>
          <p className="text-sm text-white/80">{agencyContact.email}</p>
          <a
            href={`https://wa.me/${agencyContact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-gold hover:underline"
          >
            WhatsApp
          </a>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
            Un conseiller vous recontacte par email ou WhatsApp sous 24 heures.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Lettre d’information
          </p>
          <p className="mt-4 text-sm text-white/70">
            Nouveaux voyages, inspirations et actualités de l’agence.
          </p>
          <NewsletterSignup variant="dark" />
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/45 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
        © {new Date().getFullYear()} MD Tours. Tous droits réservés.{" "}
        <a
          href="/droits-images"
          className="text-white/70 underline-offset-2 hover:text-gold hover:underline"
        >
          Droits à l’image
        </a>
      </div>
    </footer>
  );
}
