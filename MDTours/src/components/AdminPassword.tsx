"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminPassword() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Modification impossible.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Mot de passe mis à jour. Utilisez-le à la prochaine connexion.");
    } catch {
      setError("Modification impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="text-sm text-gray-500">
        Compte : <span className="font-semibold text-navy">{user?.email}</span>
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid max-w-md gap-3 rounded-2xl bg-white p-5 shadow-card"
      >
        <label className="text-sm font-medium text-navy">
          Mot de passe actuel
          <input
            required
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Nouveau mot de passe
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="text-sm font-medium text-navy">
          Confirmer le nouveau mot de passe
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        <button type="submit" disabled={saving} className="btn-gold w-fit">
          {saving ? "Enregistrement..." : "Enregistrer le mot de passe"}
        </button>
      </form>

      <div className="mt-6 max-w-md rounded-2xl bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-navy">Test d’envoi email</h2>
        <p className="mt-1 text-sm text-gray-500">
          Envoie un message de test à {user?.email}. Faites-le après un déploiement
          Railway, une fois SMTP_HOST, SMTP_USER et SMTP_PASS enregistrés.
        </p>
        <button
          type="button"
          disabled={testingEmail}
          onClick={() => {
            void (async () => {
              setError("");
              setNotice("");
              setTestingEmail(true);
              try {
                const response = await fetch("/api/admin/email-test", { method: "POST" });
                const data = (await response.json()) as { error?: string };
                if (!response.ok) {
                  setError(data.error ?? "Test email impossible.");
                  return;
                }
                setNotice("Email de test envoyé. Vérifiez la boîte de réception et les indésirables.");
              } catch {
                setError("Test email impossible.");
              } finally {
                setTestingEmail(false);
              }
            })();
          }}
          className="btn-gold mt-3 w-fit"
        >
          {testingEmail ? "Envoi du test..." : "Envoyer un email de test"}
        </button>
      </div>
    </section>
  );
}
