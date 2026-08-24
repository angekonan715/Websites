"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setResetUrl("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      setNotice(
        data.message ??
          "Si un compte existe pour cet email, un lien a été envoyé."
      );
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-search sm:p-8">
      <h1 className="text-2xl font-bold text-navy">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-gray-500">
        Indiquez l’email de votre compte. S’il existe, vous recevrez un lien
        pour en choisir un nouveau.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-navy">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {notice}
          </p>
        ) : null}
        {resetUrl ? (
          <p className="rounded-lg bg-gold/10 px-3 py-2 text-sm text-navy">
            Email non configuré en local.{" "}
            <a href={resetUrl} className="font-semibold text-gold underline">
              Ouvrir le lien de réinitialisation
            </a>
          </p>
        ) : null}
        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <a href="/connexion" className="font-semibold text-gold">
          Retour à la connexion
        </a>
      </p>
    </div>
  );
}
