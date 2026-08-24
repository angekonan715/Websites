"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Copy, ImagePlus } from "lucide-react";
import type { Testimonial, TestimonyInvite } from "@/lib/types";

export default function AdminTestimonials() {
  const [invites, setInvites] = useState<TestimonyInvite[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState("");
  const [uploadingId, setUploadingId] = useState("");

  async function load() {
    const [inviteRes, testimonialRes] = await Promise.all([
      fetch("/api/invites"),
      fetch("/api/testimonials"),
    ]);
    const inviteData = (await inviteRes.json()) as { invites?: TestimonyInvite[] };
    const testimonialData = (await testimonialRes.json()) as {
      testimonials?: Testimonial[];
    };
    setInvites(inviteData.invites ?? []);
    setTestimonials(testimonialData.testimonials ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function generateLink() {
    setError("");
    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const data = (await response.json()) as {
      error?: string;
      invite?: TestimonyInvite;
    };
    if (!response.ok || !data.invite) {
      setError(data.error ?? "Impossible de créer le lien.");
      return;
    }
    const url = `${window.location.origin}/temoignages/nouveau?invite=${data.invite.token}`;
    setLink(url);
    setNote("");
    await load();
  }

  async function copyLink(url: string, token?: string) {
    await navigator.clipboard.writeText(url);
    setLink(url);
    if (token) setCopiedToken(token);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    await fetch("/api/testimonials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function addPhotos(id: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const files = (form.elements.namedItem("images") as HTMLInputElement)?.files;
    if (!files || files.length === 0) return;
    setUploadingId(id);
    setError("");
    const formData = new FormData();
    formData.set("id", id);
    Array.from(files).forEach((file) => formData.append("images", file));
    const response = await fetch("/api/testimonials/photos", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { error?: string };
    setUploadingId("");
    if (!response.ok) {
      setError(data.error ?? "Ajout des photos impossible.");
      return;
    }
    form.reset();
    await load();
  }

  async function removePhoto(id: string, image: string) {
    await fetch(
      `/api/testimonials/photos?id=${encodeURIComponent(id)}&image=${encodeURIComponent(image)}`,
      { method: "DELETE" }
    );
    await load();
  }

  async function removeTestimony(id: string) {
    if (!confirm("Retirer définitivement cet avis de l’historique ?")) return;
    await fetch(`/api/testimonials?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  const pending = testimonials.filter((item) => item.status === "pending");
  const published = testimonials.filter((item) => item.status === "approved");

  return (
    <section>
      <p className="text-sm text-gray-500">
        Le texte d’un avis n’est pas modifiable. Les clients publient
        directement sur l’historique. N’ajoutez une photo que si le client (et
        les personnes visibles) ont accepté.{" "}
        <a href="/droits-images" className="font-semibold text-gold">
          Droits à l’image
        </a>
        .
      </p>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card sm:flex-row">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nom du client (optionnel)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button type="button" onClick={() => void generateLink()} className="btn-gold">
          Générer un lien
        </button>
      </div>
      {link && (
        <div className="mt-3 rounded-xl bg-gold/10 px-4 py-3 text-sm text-navy">
          <p className="font-semibold">Lien d’avis prêt à envoyer</p>
          <p className="mt-1 break-all">{link}</p>
          <button
            type="button"
            onClick={() => void copyLink(link)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold"
          >
            <Copy className="h-3.5 w-3.5" />
            Copier le lien
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-3">
        {invites.slice(0, 8).map((invite) => {
          const url = `/temoignages/nouveau?invite=${invite.token}`;
          return (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-card"
            >
              <div>
                <p className="font-medium text-navy">{invite.note}</p>
                <p className="text-xs text-gray-500">
                  {invite.usedAt ? "Utilisé" : "En attente"} · expire le{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              {!invite.usedAt && (
                <button
                  type="button"
                  onClick={() => void copyLink(`${window.location.origin}${url}`, invite.token)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedToken === invite.token ? "Copié" : "Copier le lien"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="mt-8 font-semibold text-navy">Avis à modérer</h3>
      <div className="mt-3 space-y-3">
        {pending.map((item) => (
          <TestimonyAdminCard
            key={item.id}
            item={item}
            uploading={uploadingId === item.id}
            onStatus={updateStatus}
            onAddPhotos={addPhotos}
            onRemovePhoto={removePhoto}
            onDelete={removeTestimony}
          />
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-gray-500">Aucun avis en attente.</p>
        )}
      </div>

      <h3 className="mt-8 font-semibold text-navy">Avis publiés</h3>
      <div className="mt-3 space-y-3">
        {published.map((item) => (
          <TestimonyAdminCard
            key={item.id}
            item={item}
            uploading={uploadingId === item.id}
            onStatus={updateStatus}
            onAddPhotos={addPhotos}
            onRemovePhoto={removePhoto}
            onDelete={removeTestimony}
          />
        ))}
        {published.length === 0 && (
          <p className="text-sm text-gray-500">Aucun avis publié pour le moment.</p>
        )}
      </div>
    </section>
  );
}

function TestimonyAdminCard({
  item,
  uploading,
  onStatus,
  onAddPhotos,
  onRemovePhoto,
  onDelete,
}: {
  item: Testimonial;
  uploading: boolean;
  onStatus: (id: string, status: "approved" | "rejected") => void;
  onAddPhotos: (id: string, event: FormEvent<HTMLFormElement>) => void;
  onRemovePhoto: (id: string, image: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-navy">
        {item.authorName} · {item.tripTitle} · {item.rating}/5
      </p>
      <blockquote className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm italic text-gray-600">
        “{item.message}”
      </blockquote>
      <p className="mt-2 text-xs text-gray-400">
        Texte du client — non modifiable
      </p>

      {(item.images ?? []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(item.images ?? []).map((src) => (
            <div key={src} className="relative h-16 w-20 overflow-hidden rounded-lg">
              <Image src={src} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => onRemovePhoto(item.id, src)}
                className="absolute right-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => onAddPhotos(item.id, event)}
        className="mt-3 flex flex-wrap items-center gap-2"
      >
        <label className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-gold">
          <ImagePlus className="h-3.5 w-3.5" />
          Ajouter des photos
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              const form = event.currentTarget.form;
              if (form && event.currentTarget.files?.length) {
                form.requestSubmit();
              }
            }}
          />
        </label>
        {uploading && <span className="text-xs text-gray-500">Envoi...</span>}
      </form>

      <div className="mt-3 flex gap-2">
        {item.status !== "approved" && (
          <button
            type="button"
            onClick={() => onStatus(item.id, "approved")}
            className="btn-gold px-4 py-2 text-xs"
          >
            Publier
          </button>
        )}
        {item.status !== "rejected" && (
          <button
            type="button"
            onClick={() => onStatus(item.id, "rejected")}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold"
          >
            {item.status === "approved" ? "Retirer de l’historique" : "Refuser"}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
        >
          Supprimer
        </button>
      </div>
    </article>
  );
}
