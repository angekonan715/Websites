"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, Type } from "lucide-react";
import type { AboutBlock, AboutPage } from "@/lib/types";

function newId() {
  return crypto.randomUUID();
}

export default function AdminAbout() {
  const [kicker, setKicker] = useState("À propos");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [blocks, setBlocks] = useState<AboutBlock[]>([]);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/about")
      .then((response) => response.json())
      .then((data: { page?: AboutPage }) => {
        if (!data.page) return;
        setKicker(data.page.kicker);
        setTitle(data.page.title);
        setSubtitle(data.page.subtitle);
        setBlocks(data.page.blocks);
      })
      .catch(() => undefined);
  }, []);

  function addBlock(type: AboutBlock["type"]) {
    setBlocks((current) => [
      ...current,
      { id: newId(), type, text: "", caption: "", image: "" },
    ]);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("kicker", kicker);
      formData.set("title", title);
      formData.set("subtitle", subtitle);
      formData.set("blocks", JSON.stringify(blocks));
      Object.entries(files).forEach(([id, file]) => {
        formData.set(`image-${id}`, file);
      });
      const response = await fetch("/api/about", {
        method: "PUT",
        body: formData,
      });
      const data = (await response.json()) as { error?: string; page?: AboutPage };
      if (!response.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      if (data.page) {
        setBlocks(data.page.blocks);
        setFiles({});
      }
      setMessage("Article À propos mis à jour.");
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <p className="text-sm text-gray-500">
        Rédigez la page comme un article : titres, paragraphes et photos. Le
        texte définit l’entreprise.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 space-y-4 rounded-2xl bg-white p-5 shadow-card"
      >
        <label className="block text-sm font-medium text-navy">
          Sur-titre
          <input
            value={kicker}
            onChange={(e) => setKicker(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Titre de l’article
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Chapô
          <textarea
            rows={2}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock("heading")}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy"
          >
            <Type className="h-3.5 w-3.5 text-gold" />
            Titre
          </button>
          <button
            type="button"
            onClick={() => addBlock("paragraph")}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy"
          >
            Paragraphe
          </button>
          <button
            type="button"
            onClick={() => addBlock("image")}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-navy"
          >
            <ImagePlus className="h-3.5 w-3.5 text-gold" />
            Photo
          </button>
        </div>

        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div key={block.id} className="rounded-xl border border-gray-100 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">
                  {block.type === "heading"
                    ? "Titre"
                    : block.type === "image"
                      ? "Photo"
                      : "Paragraphe"}
                </p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveBlock(index, -1)} aria-label="Monter">
                    <ArrowUp className="h-4 w-4 text-gray-400" />
                  </button>
                  <button type="button" onClick={() => moveBlock(index, 1)} aria-label="Descendre">
                    <ArrowDown className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBlocks((current) => current.filter((item) => item.id !== block.id))
                    }
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              {block.type === "image" ? (
                <>
                  {block.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={block.image}
                      alt=""
                      className="mb-2 h-32 w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFiles((current) => ({ ...current, [block.id]: file }));
                    }}
                    className="w-full text-sm"
                  />
                  <input
                    value={block.caption ?? ""}
                    onChange={(e) =>
                      setBlocks((current) =>
                        current.map((item) =>
                          item.id === block.id ? { ...item, caption: e.target.value } : item
                        )
                      )
                    }
                    placeholder="Légende (optionnel)"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                </>
              ) : (
                <textarea
                  required
                  rows={block.type === "heading" ? 2 : 4}
                  value={block.text ?? ""}
                  onChange={(e) =>
                    setBlocks((current) =>
                      current.map((item) =>
                        item.id === block.id ? { ...item, text: e.target.value } : item
                      )
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Enregistrement..." : "Publier l’article"}
        </button>
      </form>
    </section>
  );
}
