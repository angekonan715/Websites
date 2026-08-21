export default function CustomTripCta() {
  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-navy px-5 py-8 text-white sm:px-12 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Voyage personnalisé
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">
          Vous avez une autre idée de voyage ?
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/75">
          Composez votre séjour : voyageurs, dates, hébergement, véhicule et
          activités. Le tarif s’affiche au fur et à mesure.
        </p>
        <a href="/voyage-personnalise" className="btn-gold mt-6 inline-flex">
          Créer un voyage personnalisé
        </a>
      </div>
    </section>
  );
}
