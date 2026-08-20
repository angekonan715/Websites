"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        mode === "signin" ? "/api/auth/signin" : "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "signin" ? { email, password } : { name, email, password }
          ),
        }
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      await refresh();
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-search">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded-lg py-2 text-sm font-semibold ${
            mode === "signin" ? "bg-white text-navy shadow-sm" : "text-gray-500"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-lg py-2 text-sm font-semibold ${
            mode === "signup" ? "bg-white text-navy shadow-sm" : "text-gray-500"
          }`}
        >
          Créer un compte
        </button>
      </div>

      <h1 className="text-2xl font-bold text-navy">
        {mode === "signin" ? "Bon retour" : "Rejoignez MD Tours"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {mode === "signin"
          ? "Connectez-vous pour gérer votre espace."
          : "Créez un compte pour suivre vos voyages."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <label className="block text-sm font-medium text-navy">
            Nom
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>
        )}
        <label className="block text-sm font-medium text-navy">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Mot de passe
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading
            ? "Veuillez patienter..."
            : mode === "signin"
              ? "Se connecter"
              : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
