import type { Destination, MegaMenuLink, MegaMenuRegion, MegaMenus } from "./types";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function tripLinks(trips: Destination[]): MegaMenuLink[] {
  return trips.map((trip) => ({
    id: trip.id,
    label: trip.title,
    href: `/voyages/${trip.id}`,
    image: trip.image,
  }));
}

function isDemandesLink(link: MegaMenuLink) {
  return /demande/i.test(link.label) || link.href.includes("/demandes");
}

function isGroupRegion(region: MegaMenuRegion) {
  return region.id === "groupes" || /group[eé]/i.test(region.label);
}

export function regionPath(regionId: string) {
  return `/destinations/${regionId}`;
}

export function placePath(regionId: string, placeId: string) {
  return `/destinations/${regionId}/${placeId}`;
}

function withDestinationPaths(regions: MegaMenuRegion[]): MegaMenuRegion[] {
  return regions.map((region) => ({
    ...region,
    href: regionPath(region.id),
    destinations: region.destinations.map((place) => {
        const id = place.id || slugify(place.label) || "lieu";
      return {
        ...place,
        id,
        href: placePath(region.id, id),
      };
    }),
  }));
}

export const defaultMegaMenus: MegaMenus = {
  destinations: [
    {
      id: "ghana",
      label: "Ghana",
      href: "/destinations/ghana",
      image: "/images/cape-coast.png",
      tagline: "Côtes, savane, héritage et capitales",
      destinations: [
        {
          id: "cape-coast",
          label: "Cape Coast",
          href: "/destinations/ghana/cape-coast",
          image: "/images/cape-coast.png",
          description:
            "Ville historique de la côte ghanéenne, entre forts, océan et mémoire.",
        },
        {
          id: "boti-falls",
          label: "Boti Falls",
          href: "/destinations/ghana/boti-falls",
          image: "/images/boti-waterfall.png",
          description:
            "Chutes d’eau et forêt de l’est du Ghana, pour un moment plus nature.",
        },
        {
          id: "mole",
          label: "Mole",
          href: "/destinations/ghana/mole",
          image: "/images/mole-national-park.png",
          description:
            "Parc de savane au nord du Ghana, éléphants et grands espaces.",
        },
        {
          id: "cote",
          label: "Côte atlantique",
          href: "/destinations/ghana/cote",
          image: "/images/beach.png",
          description:
            "Plages et lumière de l’Atlantique, pour se poser après la route.",
        },
      ],
    },
  ],
  voyages: [
    {
      id: "groupes",
      label: "Voyage groupé",
      href: "/voyages/groupes",
      image: "/images/cape-coast.png",
      tagline: "Tous les séjours en petit groupe, prêts à réserver",
      destinations: [],
    },
    {
      id: "personnalise",
      label: "Voyage personnalisé",
      href: "/voyage-personnalise",
      image: "/images/beach.png",
      tagline: "Dates, hébergement, véhicule et activités à composer",
      destinations: [
        {
          id: "creer",
          label: "Créer un voyage",
          href: "/voyage-personnalise",
          image: "/images/beach.png",
        },
      ],
    },
  ],
};

export function enrichMegaMenus(
  menus: MegaMenus,
  trips: Destination[]
): MegaMenus {
  const allLinks = tripLinks(trips);
  const destinations = withDestinationPaths(
    menus.destinations.length > 0
      ? menus.destinations
      : defaultMegaMenus.destinations
  );

  let voyages =
    menus.voyages.length > 0 ? menus.voyages : defaultMegaMenus.voyages;
  voyages = voyages.map((region) => ({
    ...region,
    destinations: isGroupRegion(region)
      ? allLinks
      : region.destinations
          .filter((link) => !isDemandesLink(link))
          .map((link) => ({
            ...link,
            image: link.image || region.image,
          })),
  }));

  if (!voyages.some(isGroupRegion)) {
    voyages = [
      {
        ...defaultMegaMenus.voyages[0],
        destinations: allLinks,
        image: trips[0]?.image ?? defaultMegaMenus.voyages[0].image,
      },
      ...voyages,
    ];
  }

  return { destinations, voyages };
}

export function emptyMegaRegion(): MegaMenuRegion {
  const id = crypto.randomUUID();
  return {
    id,
    label: "Nouveau pays / région",
    href: regionPath(id),
    image: "/images/cape-coast.png",
    tagline: "",
    destinations: [],
  };
}

export function emptyMegaPlace(regionId: string): MegaMenuLink {
  const id = crypto.randomUUID();
  return {
    id,
    label: "",
    href: placePath(regionId, id),
    image: "",
    description: "",
  };
}

export function findMegaRegion(regions: MegaMenuRegion[], regionId: string) {
  return regions.find((region) => region.id === regionId);
}

export function findMegaPlace(region: MegaMenuRegion, placeId: string) {
  return region.destinations.find((place) => place.id === placeId);
}
