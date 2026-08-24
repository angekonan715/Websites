/**
 * Media folders (drop files here, then reference the path below):
 *   public/background/  → hero image  (replace hero.png)
 *   public/images/      → destination photos
 *   public/video/       → optional hero video (e.g. hero.mp4)
 */

export const heroMedia = {
  image: "/background/hero.png",
  /** Set to "/video/hero.mp4" after adding a file in public/video/ */
  video: "",
};

export type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const navLinks: NavLink[] = [
  {
    label: "Accueil",
    href: "/",
  },
  {
    label: "Nos Voyages",
    href: "/voyages",
  },
  { label: "Destinations", href: "/destinations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Historique", href: "/historique" },
  { label: "Contact", href: "/contact" },
];

export const trustBadges = [
  {
    icon: "users",
    title: "Petits groupes",
    description: "Des séjours à taille humaine, pour vraiment rencontrer l’Afrique.",
  },
  {
    icon: "shield",
    title: "Hébergements choisis",
    description: "Hôtels et lodges sélectionnés pour le confort et le caractère.",
  },
  {
    icon: "headset",
    title: "Guides de confiance",
    description: "Un accompagnement humain avant, pendant et après le voyage.",
  },
  {
    icon: "tag",
    title: "Tarif transparent",
    description: "Le prix annoncé est le prix : pas de frais cachés.",
  },
  {
    icon: "shield-check",
    title: "Sérénité",
    description: "Itinéraires préparés avec soin, sécurité et suivi inclus.",
  },
];

export function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR");
}

export const agencyContact = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+225 05 56 63 37 66",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "2250556633766",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "mdcontact@voyagezmdtours.com",
};

export const reservationStatusLabel: Record<string, string> = {
  awaiting_contact: "En attente de contact MD Tours",
  payment_received: "Paiement confirmé",
  confirmed: "Rendez-vous confirmé",
  cancelled: "Annulée",
};

export const customTripStatusLabel: Record<string, string> = {
  pending: "En attente de MD Tours",
  proposal_sent: "Proposition envoyée",
  closed: "Clôturée",
};

export const travelKinds = [
  {
    id: "safari",
    label: "Safari",
    description: "Parcs, faune et savane",
  },
  {
    id: "plage",
    label: "Plage & détente",
    description: "Côte, mer et resort",
  },
  {
    id: "ville",
    label: "Ville & culture",
    description: "Capitales, marchés, gastronomie",
  },
  {
    id: "patrimoine",
    label: "Patrimoine",
    description: "Histoire, forts et mémoire",
  },
  {
    id: "nature",
    label: "Nature & chutes",
    description: "Forêts, rivières, paysages",
  },
  {
    id: "famille",
    label: "Famille",
    description: "Rythme doux, tout public",
  },
  {
    id: "lune-de-miel",
    label: "Lune de miel",
    description: "Séjour romantique",
  },
  {
    id: "aventure",
    label: "Aventure",
    description: "Rando, découverte active",
  },
  {
    id: "autre",
    label: "Autre idée",
    description: "Décrivez votre projet",
  },
];
