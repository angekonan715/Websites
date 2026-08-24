export const adminCategoryGroups = [
  { id: "offre", label: "Offre" },
  { id: "commercial", label: "Commercial" },
  { id: "contenu", label: "Contenu du site" },
  { id: "compte", label: "Votre compte" },
] as const;

export const adminCategories = [
  {
    id: "voyages",
    group: "offre",
    label: "Voyages de groupe",
    description: "Créer les séjours, voir les inscrits et gérer les promotions.",
  },
  {
    id: "personnalise",
    group: "offre",
    label: "Voyages personnalisés",
    description: "Tarifs du catalogue et demandes envoyées par les clients.",
  },
  {
    id: "reservations",
    group: "commercial",
    label: "Réservations",
    description: "Tous les dossiers, les voyages confirmés et les paiements.",
  },
  {
    id: "clients",
    group: "commercial",
    label: "Clients",
    description: "Fiches clients : téléphone, montants payés et voyages.",
  },
  {
    id: "campagnes",
    group: "commercial",
    label: "Campagnes",
    description: "Bandeau d’actualités, messages et dates de fin.",
  },
  {
    id: "liens",
    group: "commercial",
    label: "Liens Instagram / TikTok",
    description: "Générer un lien court à coller dans un post ou dans la bio.",
  },
  {
    id: "a-propos",
    group: "contenu",
    label: "À propos",
    description: "Article de présentation de l’agence.",
  },
  {
    id: "historique",
    group: "contenu",
    label: "Historique",
    description: "Voyages passés publiés sur le site.",
  },
  {
    id: "temoignages",
    group: "contenu",
    label: "Témoignages",
    description: "Avis clients et liens d’invitation.",
  },
  {
    id: "mot-de-passe",
    group: "compte",
    label: "Mot de passe",
    description: "Changer le mot de passe de connexion administrateur.",
  },
] as const;

export type AdminCategoryId = (typeof adminCategories)[number]["id"];

export function getAdminCategory(id: string | null) {
  if (!id) return undefined;
  return adminCategories.find((item) => item.id === id);
}
