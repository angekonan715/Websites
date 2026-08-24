"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";

export default function NewTestimonialForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("invite") ?? "";
  const { user, loading } = useAuth();
  const [tripTitle, setTripTitle] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [valid, setValid] = useState(false);
  const [imageRights, setImageRights] = useState(false);

  const previews = useMemo(
    () => photos.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [photos]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  useEffect(() => {
    if (!token) {
      setInviteError("Ce lien d’invitation est manquant.");
      return;
    }
    fetch(`/api/invites/check?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data: { valid?: boolean; reason?: string }) => {
        setValid(Boolean(data.valid));
        setInviteError(data.valid ? "" : data.reason ?? "Lien invalide.");
      })
      .catch(() => setInviteError("Impossible de vérifier le lien."));
  }, [token]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/"));
    setPhotos((current) => [...current, ...incoming].slice(0, 8));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("tripTitle", tripTitle);
      formData.set("rating", String(rating));
      formData.set("message", message);
      formData.set("imageRights", imageRights ? "1" : "0");
      photos.forEach((file) => formData.append("images", file));

      const response = await fetch("/api/testimonials", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      router.push("/temoignages/merci");
    } catch {
      setError("Envoi impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto max-w-xl px-4 py-14">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Partager votre témoignage</h1>
        <p className="mt-2 text-sm text-gray-500">
          Racontez votre voyage et joignez des photos. Votre témoignage est
          publié tout de suite sur l’historique. En ajoutant des photos, vous
          autorisez MD Tours à les afficher —{" "}
          <a href="/droits-images" className="font-semibold text-gold">
            voir les droits à l’image
          </a>
          .
        </p>

        {!loading && !user && (
          <p className="mt-6 rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
            <a
              href={`/connexion?next=${encodeURIComponent(`/temoignages/nouveau?invite=${token}`)}`}
              className="font-semibold text-gold"
            >
              Connectez-vous
            </a>{" "}
            pour témoigner.
          </p>
        )}

        {inviteError && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {inviteError}
          </p>
        )}

        {user && valid && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl bg-white p-4 shadow-search sm:p-6">
            <label className="block text-sm font-medium text-navy">
              Voyage effectué
              <input
                required
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
            placeholder="Cape Coast Heritage"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium text-navy">
              Note
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Votre témoignage
              <textarea
                required
                minLength={20}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
              />
            </label>
            <div>
              <p className="text-sm font-medium text-navy">Photos du voyage</p>
              <p className="mt-1 text-xs text-gray-500">
                Jusqu’à 8 photos (JPG, PNG ou WEBP). N’ajoutez que des photos
                dont vous avez le droit d’usage, y compris l’accord des
                personnes reconnaissables.
              </p>
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-4 py-8 text-center hover:border-gold">
                <ImagePlus className="h-6 w-6 text-gold" />
                <span className="mt-2 text-sm font-semibold text-navy">
                  Ajouter des photos
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {previews.map((item, index) => (
                    <div key={item.url} className="relative aspect-square overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Retirer la photo"
                        onClick={() =>
                          setPhotos((current) => current.filter((_, i) => i !== index))
                        }
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
              <input
                required
                type="checkbox"
                checked={imageRights}
                onChange={(e) => setImageRights(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#D99B15]"
              />
              <span>
                J’autorise MD Tours à publier ce témoignage et les photos
                jointes sur le site. Je confirme avoir le droit de les partager
                et l’accord des personnes visibles.{" "}
                <a href="/droits-images" className="font-semibold text-gold">
                  Lire les droits à l’image
                </a>
                .
              </span>
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving || !imageRights}
              className="btn-gold w-full"
            >
              {saving ? "Envoi..." : "Envoyer mon témoignage"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
