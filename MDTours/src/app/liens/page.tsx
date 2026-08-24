import Header from "@/components/Header";
import { agencyContact } from "@/data/home";
import { getShareLinks } from "@/lib/store";

export const metadata = {
  title: "MD Tours — Nos liens",
  description: "Accédez aux voyages et pages MD Tours depuis Instagram ou TikTok.",
};

export default async function SocialLinksPage() {
  const links = (await getShareLinks()).filter((item) => item.active && item.showOnBio);
  const fallback = [
    { href: "/voyages/groupes", label: "Voyages de groupe" },
    { href: "/voyage-personnalise", label: "Voyage personnalisé" },
    { href: "/a-propos", label: "À propos" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <main className="min-h-screen bg-navy">
      <Header variant="solid" />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          MD Tours
        </p>
        <h1 className="mt-2 text-center text-3xl font-bold text-white">Le guide de confiance</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm text-white/70">
          Choisissez une page. Ces liens sont faits pour Instagram et TikTok.
        </p>

        <div className="mt-8 space-y-3">
          {(links.length > 0
            ? links.map((item) => ({ href: `/go/${item.slug}`, label: item.title }))
            : fallback
          ).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-2xl bg-white px-5 py-4 text-center text-sm font-semibold text-navy shadow-card transition hover:bg-gold hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <a
            href={`https://wa.me/${agencyContact.whatsapp.replace(/\D/g, "")}`}
            className="block rounded-2xl border border-white/20 px-5 py-4 text-center text-sm font-semibold text-white hover:border-gold hover:text-gold"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
