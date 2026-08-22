import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import { agencyContact } from "@/data/home";

export default function ImageRightsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero
        kicker="Droits à l’image"
        title="Comment MD Tours utilise les photos"
        subtitle="Nous ne publions une photo que si nous avons le droit de le faire — et vous pouvez demander son retrait."
      />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-14 text-sm leading-relaxed text-gray-600 sm:px-6">
        <section>
          <h2 className="text-xl font-bold text-navy">Principe</h2>
          <p className="mt-3">
            Une photo où une personne est reconnaissable n’appartient pas
            automatiquement à MD Tours. Le droit à l’image appartient à la
            personne photographiée. MD Tours ne publie donc des visages que
            dans les cas suivants :
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>la personne a donné son accord écrit ou coché le consentement sur le site ;</li>
            <li>
              un client publie lui-même une photo et confirme qu’il a le droit
              de la partager, y compris pour les autres personnes visibles ;
            </li>
            <li>la photo ne montre personne de façon identifiable (paysage, monument, foule lointaine).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy">Témoignages clients</h2>
          <p className="mt-3">
            En envoyant un témoignage avec des photos, le client autorise MD
            Tours à afficher ce texte et ces images sur le site (page
            Historique et supports de l’agence), à des fins de présentation
            des voyages. Il déclare :
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>être l’auteur des photos, ou avoir l’autorisation de les utiliser ;</li>
            <li>
              avoir l’accord des personnes reconnaissables sur les photos,
              surtout les mineurs (accord du parent ou tuteur) ;
            </li>
            <li>
              comprendre que le témoignage est publié tout de suite, et qu’il
              peut demander son retrait à tout moment.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy">Photos prises pendant un voyage</h2>
          <p className="mt-3">
            Pour l’historique des voyages organisés par MD Tours, l’agence ne
            publie une photo de groupe que si les personnes visibles ont été
            informées et ont accepté (formulaire, message, ou accord pendant
            le séjour). En cas de doute, la photo n’est pas mise en ligne, ou
            les visages sont floutés.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-navy">Retrait d’une photo</h2>
          <p className="mt-3">
            Toute personne reconnaissable, ou tout client ayant publié un
            avis, peut demander le retrait d’une photo ou d’un témoignage.
            Écrivez à{" "}
            <a href={`mailto:${agencyContact.email}`} className="font-semibold text-gold">
              {agencyContact.email}
            </a>{" "}
            ou contactez-nous via{" "}
            <a href="/contact" className="font-semibold text-gold">
              la page Contact
            </a>
            . MD Tours retire le contenu dès que possible.
          </p>
        </section>

        <p className="text-xs text-gray-400">
          Cette page explique la pratique de MD Tours. Elle ne remplace pas
          un conseil juridique. Pour un contrat d’autorisation d’image à
          faire signer pendant les voyages, un avocat local reste le plus sûr.
        </p>
      </article>
    </main>
  );
}
