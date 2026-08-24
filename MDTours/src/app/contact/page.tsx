import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { agencyContact } from "@/data/home";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Header variant="solid" />
      <PageHero
        kicker="Contact"
        title="Parlons de votre prochain voyage"
        subtitle="Écrivez-nous : un conseiller MD Tours vous répond."
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm text-gray-600">Téléphone : {agencyContact.phone}</p>
          <p className="text-sm text-gray-600">Email : {agencyContact.email}</p>
          <a
            href={`https://wa.me/${agencyContact.whatsapp}`}
            className="mt-4 inline-flex font-semibold text-gold"
          >
            WhatsApp
          </a>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
