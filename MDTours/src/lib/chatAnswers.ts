import { agencyContact, formatPrice } from "@/data/home";
import type { Destination } from "@/lib/types";

export type ChatAnswer = {
  reply: string;
  offerWhatsApp: boolean;
  showMenu?: boolean;
};

export function whatsappChatUrl(question?: string) {
  const digits = agencyContact.whatsapp.replace(/\D/g, "");
  const body = question?.trim()
    ? `Bonjour MD Tours, j’ai une question depuis le site : ${question.trim()}`
    : "Bonjour MD Tours, je vous contacte depuis le chat du site.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function hasAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

export function isMenuRequest(question: string) {
  const q = normalize(question)
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (
    q === "menu" ||
    q === "le menu" ||
    q === "accueil" ||
    q === "retour" ||
    q === "menu principal" ||
    q.includes("retour au menu") ||
    q.includes("revenir au menu")
  );
}

function tripLine(trip: Destination) {
  const places =
    typeof trip.availablePlaces === "number"
      ? trip.availablePlaces > 0
        ? `${trip.availablePlaces} place${trip.availablePlaces > 1 ? "s" : ""}`
        : "complet"
      : trip.duration;
  return `• ${trip.title} (${trip.country}) — ${formatPrice(trip.price)} FCFA, ${trip.duration}, ${places}`;
}

function tripsAnswer(trips: Destination[]): ChatAnswer {
  if (!trips.length) {
    return {
      offerWhatsApp: true,
      reply:
        "Aucun voyage n’est publié pour le moment. Un conseiller MD Tours peut vous renseigner sur WhatsApp.",
    };
  }
  return {
    offerWhatsApp: false,
    reply: [
      "Voici nos séjours actuellement proposés :",
      "",
      ...trips.map(tripLine),
      "",
      "Détail et inscription : voyagezmdtours.com/voyages",
      "La réservation se fait sur le site, pas dans ce chat.",
    ].join("\n"),
  };
}

export function answerChat(question: string, trips: Destination[]): ChatAnswer {
  const q = normalize(question);

  if (isMenuRequest(question)) {
    return {
      offerWhatsApp: false,
      showMenu: true,
      reply: "Voici le menu. Choisissez une question, ou écrivez la vôtre.",
    };
  }

  if (
    hasAny(q, [
      "carte bancaire",
      "numero de carte",
      "numéro de carte",
      "cvv",
      "mot de passe",
      "password",
      "code secret",
    ])
  ) {
    return {
      offerWhatsApp: false,
      reply: [
        "Ne communiquez jamais de mot de passe ni de numéro de carte dans ce chat.",
        "MD Tours ne vous demandera un paiement que par le WhatsApp ou le téléphone indiqués dans l’en-tête du site.",
      ].join("\n"),
    };
  }

  if (hasAny(q, ["paiement", "payer", "virement", "orange money", "wave", "depot", "dépôt"])) {
    return {
      offerWhatsApp: false,
      reply: [
        "Ce chat ne prend pas de paiement et ne donne pas d’instructions d’envoi d’argent.",
        "Inscrivez-vous sur la page du voyage. Un conseiller MD Tours vous contacte ensuite par le WhatsApp ou le téléphone de l’en-tête.",
      ].join("\n"),
    };
  }

  if (hasAny(q, ["confirme", "confirmé", "reservé", "réservé", "je suis inscrit", "ma reservation", "ma réservation"])) {
    return {
      offerWhatsApp: false,
      reply: [
        "Ce chat ne confirme pas une réservation.",
        "Inscrivez-vous sur le site, puis suivez votre dossier dans « Mes réservations » après connexion.",
        "Un conseiller confirme le paiement et la suite par le WhatsApp de l’en-tête.",
      ].join("\n"),
    };
  }

  if (hasAny(q, ["conseiller", "whatsapp", "contact", "telephone", "appeler", "humain"])) {
    return {
      offerWhatsApp: true,
      reply: [
        "Un conseiller MD Tours vous répond par WhatsApp ou par téléphone.",
        "",
        `WhatsApp / tél. : ${agencyContact.phone}`,
        `Email : ${agencyContact.email}`,
        "",
        "Dites-lui le voyage qui vous intéresse. Ce chat ne prend pas de paiement.",
      ].join("\n"),
    };
  }

  if (hasAny(q, ["document", "passeport", "passport", "visa", "vaccin", "carnet"])) {
    const fromTrips = trips
      .map((trip) => trip.description ?? "")
      .join(" ")
      .toLowerCase();
    const needsPassport = /passport|passeport/.test(fromTrips);
    const needsYellow = /fievre jaune|fièvre jaune|vaccination jaune/.test(fromTrips);
    return {
      offerWhatsApp: false,
      reply: [
        "Les documents dépendent du séjour. En général :",
        needsPassport ? "• Passeport (ou pièce d’identité selon le voyage)" : "• Une pièce d’identité valide",
        needsYellow ? "• Carnet de vaccination (souvent fièvre jaune)" : "• Vérifiez le carnet de vaccination sur la fiche du voyage",
        "",
        "Le détail figure sur chaque page voyage. Un conseiller confirmera avant le départ.",
      ].join("\n"),
    };
  }

  if (hasAny(q, ["prix", "tarif", "cout", "coût", "combien", "date", "quand", "duree", "durée"])) {
    return tripsAnswer(trips);
  }

  if (hasAny(q, ["voyage", "sejour", "séjour", "destination", "ghana", "senegal", "sénégal", "offre"])) {
    return tripsAnswer(trips);
  }

  return {
    offerWhatsApp: true,
    reply: [
      "Je n’ai pas cette information avec certitude.",
      "Un conseiller MD Tours peut vous répondre sur WhatsApp.",
    ].join("\n"),
  };
}
