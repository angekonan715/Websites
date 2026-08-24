"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(
    token ? "" : "Lien de réinitialisation manquant ou incomplet."
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Réinitialisation impossible.");
        return;
      }
      await refresh();
      router.push("/");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-search sm:p-8">
      <h1 className="text-2xl font-bold text-navy">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-gray-500">
        Choisissez un mot de passe d’au moins 6 caractères.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-navy">
          Nouveau mot de passe
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Confirmer le mot de passe
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            disabled={!token}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !token}
          className="btn-gold w-full"
        >
          {loading ? "Enregistrement..." : "Enregistrer et se connecter"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <a href="/connexion/mot-de-passe-oublie" className="font-semibold text-gold">
          Demander un nouveau lien
        </a>
      </p>
    </div>
  );
}
