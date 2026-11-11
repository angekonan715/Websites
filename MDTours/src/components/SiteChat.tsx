"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { whatsappChatUrl } from "@/lib/chatAnswers";
import WhatsAppIcon from "@/components/WhatsAppIcon";

type ChatMessage = {
  id: number;
  from: "bot" | "user";
  text: string;
  showWhatsApp?: boolean;
};

const welcome: ChatMessage = {
  id: 1,
  from: "bot",
  text: "Bonjour, je peux vous renseigner sur nos voyages.",
};

const quickReplies = ["Nos voyages", "Prix et dates", "Documents"];

export default function SiteChat() {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [atMenu, setAtMenu] = useState(true);

  const lastQuestion = [...messages].reverse().find((item) => item.from === "user")?.text;
  const whatsappHref = useMemo(
    () => whatsappChatUrl(lastQuestion),
    [lastQuestion]
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  if (pathname?.startsWith("/admin")) return null;

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMessage: ChatMessage = { id: Date.now(), from: "user", text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setAtMenu(false);
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        offerWhatsApp?: boolean;
        showMenu?: boolean;
      };
      const reply =
        data.reply ??
        data.error ??
        "Je n’ai pas pu répondre. Réessayez, ou contactez-nous sur WhatsApp.";
      setAtMenu(Boolean(data.showMenu));
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          from: "bot",
          text: reply,
          showWhatsApp: Boolean(data.offerWhatsApp) || Boolean(data.error),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          from: "bot",
          text: "Connexion impossible. Réessayez, ou écrivez-nous sur WhatsApp.",
          showWhatsApp: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function send(event: FormEvent) {
    event.preventDefault();
    sendText(draft);
  }

  return (
    <div
      className={`pointer-events-none fixed z-40 flex flex-col items-end gap-2.5 ${
        open ? "left-[max(0.75rem,env(safe-area-inset-left))] sm:left-auto" : ""
      }`}
      style={{
        right: "max(0.75rem, env(safe-area-inset-right))",
        bottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      {open ? (
        <section
          aria-label="Assistant MD Tours"
          className="pointer-events-auto flex w-full max-h-[min(28rem,calc(100dvh-8.5rem))] h-[min(28rem,calc(100dvh-8.5rem))] flex-col overflow-hidden rounded-sm bg-white shadow-card sm:w-[22rem]"
        >
          <header className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div>
              <p className="font-editorial text-lg leading-tight">MD Tours</p>
              <p className="mt-0.5 text-xs text-white/70">Posez une question</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-gold"
              aria-label="Fermer le chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-[#f4efe6] px-3 py-3"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.from === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}
              >
                <p
                  className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    message.from === "user"
                      ? "bg-navy text-white"
                      : "bg-white text-navy shadow-sm"
                  }`}
                >
                  {message.text}
                </p>
                {message.showWhatsApp ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    Continuer sur WhatsApp
                  </a>
                ) : null}
              </div>
            ))}
            {busy ? (
              <p className="max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm text-navy/60 shadow-sm">
                …
              </p>
            ) : null}
            {atMenu && !busy ? (
              <div className="pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => sendText(label)}
                      className="min-h-11 rounded-full border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy hover:border-gold hover:text-gold"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="px-0.5 pt-2 text-[11px] leading-snug text-navy/55">
                  Plus tard, tapez « menu » pour revenir ici.
                </p>
              </div>
            ) : null}
          </div>

          {!atMenu ? (
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-white px-3 py-1.5">
              <button
                type="button"
                onClick={() => sendText("Menu")}
                disabled={busy}
                className="min-h-11 rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold hover:text-gold disabled:opacity-60"
                aria-label="Retour au menu du chat"
              >
                Retour au menu
              </button>
              <p className="text-[11px] text-navy/55">ou tapez « menu »</p>
            </div>
          ) : null}

          <form onSubmit={send} className="flex gap-2 border-t border-gray-100 bg-white p-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Votre message…"
              enterKeyHint="send"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-base outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-gold text-white hover:bg-gold-dark disabled:opacity-60"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-card hover:bg-gold-dark"
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
