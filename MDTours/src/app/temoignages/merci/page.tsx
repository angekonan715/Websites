import Header from "@/components/Header";

export default function TestimonyThanksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-navy">Merci pour votre témoignage</h1>
        <p className="mt-4 text-sm text-gray-600">
          Votre témoignage est déjà en ligne sur l’historique. Merci de
          partager votre expérience.
        </p>
        <a href="/historique#temoignages" className="btn-gold mt-8 inline-flex">
          Voir l’historique
        </a>
      </div>
    </main>
  );
}
