"use client";

import { FormEvent, useState } from "react";

export default function NewsletterSignup({ variant = "light" }: { variant?: "light" | "dark" }) {
  const dark = variant === "dark";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message:
            "Inscription à la lettre d’information MD Tours : actualités, nouveaux voyages et inspirations.",
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Inscription impossible.");
        return;
      }
      setName("");
      setEmail("");
      setNotice("Merci. Vous êtes bien inscrit(e) à nos actualités.");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <input
        required
        minLength={2}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Prénom"
        className={`w-full border px-3 py-2.5 text-sm outline-none ${
          dark
            ? "border-white/20 bg-white/5 text-white placeholder:text-white/40"
            : "border-navy/15 bg-white text-navy"
        }`}
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={`w-full border px-3 py-2.5 text-sm outline-none ${
          dark
            ? "border-white/20 bg-white/5 text-white placeholder:text-white/40"
            : "border-navy/15 bg-white text-navy"
        }`}
      />
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {notice ? <p className="text-xs text-gold-light">{notice}</p> : null}
      <button type="submit" disabled={loading} className="btn-gold w-full">
        {loading ? "Envoi..." : "S’inscrire"}
      </button>
    </form>
  );
}
