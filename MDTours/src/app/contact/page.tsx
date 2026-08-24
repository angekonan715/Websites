import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { agencyContact } from "@/data/home";
import { Clock3, Mail, MessageCircle, Phone } from "lucide-react";

const telHref = `tel:+${agencyContact.whatsapp}`;
const mailHref = `mailto:${agencyContact.email}`;
const whatsappHref = `https://wa.me/${agencyContact.whatsapp}`;

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Header variant="solid" />
      <PageHero
        kicker="Contact"
        title="Parlons de votre prochain voyage"
        subtitle="Écrivez-nous sur WhatsApp, par email ou par téléphone. MD Tours vous répond sous 24 heures."
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="section-kicker">Nous joindre</p>
          <h2 className="section-title mt-3">WhatsApp, email ou téléphone</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-navy/70 sm:text-base">
            Un conseiller MD Tours vous recontacte par{" "}
            <strong className="font-semibold text-navy">email</strong> ou{" "}
            <strong className="font-semibold text-navy">WhatsApp</strong> dans
            les <strong className="font-semibold text-navy">24 heures</strong>.
          </p>

          <div className="mt-8 flex items-start gap-3 rounded-sm border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p>
              Réponse sous 24 h, par email ou WhatsApp, sur les coordonnées que
              vous nous laissez.
            </p>
          </div>

          <ul className="mt-8 space-y-4">
            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-sm bg-white p-4 shadow-card transition hover:bg-cream-dark/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                    WhatsApp
                  </span>
                  <span className="mt-0.5 block font-editorial text-xl font-semibold text-navy">
                    {agencyContact.phone}
                  </span>
                  <span className="mt-0.5 block text-sm text-navy/60">
                    Écrire maintenant — réponse sous 24 h
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={mailHref}
                className="flex items-center gap-4 rounded-sm bg-white p-4 shadow-card transition hover:bg-cream-dark/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Email
                  </span>
                  <span className="mt-0.5 block text-base font-semibold text-navy">
                    {agencyContact.email}
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={telHref}
                className="flex items-center gap-4 rounded-sm bg-white p-4 shadow-card transition hover:bg-cream-dark/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Téléphone
                  </span>
                  <span className="mt-0.5 block text-base font-semibold text-navy">
                    {agencyContact.phone}
                  </span>
                </span>
              </a>
            </li>
          </ul>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold mt-8"
          >
            <MessageCircle className="h-4 w-4" />
            Ouvrir WhatsApp
          </a>
        </div>

        <ContactForm />
      </section>
    </main>
  );
}
