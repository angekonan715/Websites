import { agencyContact, navLinks } from "@/data/home";

export default function Footer() {
  const footerLinks = navLinks.flatMap((link) =>
    link.children?.length ? [link, ...link.children] : [link]
  );

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-12 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-extrabold">MD TOURS</p>
          <p className="mt-2 text-sm text-white/70">Voyagez autrement.</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Navigation
          </p>
          <div className="mt-3 space-y-2">
            {footerLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="block text-sm text-white/80 hover:text-gold"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Contact
          </p>
          <p className="mt-3 text-sm text-white/80">{agencyContact.phone}</p>
          <p className="text-sm text-white/80">{agencyContact.email}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
            Réserver
          </p>
          <a href="/voyages" className="mt-3 inline-flex btn-gold text-xs">
            Voir nos voyages
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
        © {new Date().getFullYear()} MD Tours. Tous droits réservés.{" "}
        <a href="/droits-images" className="text-white/70 underline-offset-2 hover:text-gold hover:underline">
          Droits à l’image
        </a>
      </div>
    </footer>
  );
}
