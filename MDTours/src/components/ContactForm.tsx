"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { agencyContact } from "@/data/home";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const whatsappHref = useMemo(() => {
    const lines = [
      name.trim() ? `Bonjour, je m’appelle ${name.trim()}.` : "Bonjour MD Tours,",
      "",
      message.trim() || "Je souhaite être recontacté(e) au sujet d’un voyage.",
    ];
    return `https://wa.me/${agencyContact.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [name, message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm bg-white p-5 shadow-card sm:p-6"
    >
      <p className="section-kicker">WhatsApp</p>
      <h2 className="font-editorial text-2xl font-semibold text-navy">
        Envoyez-nous un message
      </h2>
      <p className="text-sm leading-relaxed text-navy/70">
        Votre message s’ouvre dans WhatsApp. MD Tours vous répond par WhatsApp
        ou par email sous 24 heures.
      </p>
      <label className="block text-sm font-medium text-navy">
        Nom
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Message
        <textarea
          required
          minLength={10}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Parlez-nous de votre projet de voyage…"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </label>
      <button type="submit" className="btn-gold w-full sm:w-auto">
        <MessageCircle className="h-4 w-4" />
        Envoyer sur WhatsApp
      </button>
    </form>
  );
}
