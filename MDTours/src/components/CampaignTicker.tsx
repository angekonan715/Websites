"use client";

import { useEffect, useState } from "react";
import { isCampaignExpired } from "@/lib/campaigns";
import type { Campaign } from "@/lib/types";

function liveCampaigns(items: Campaign[]) {
  return items.filter((item) => item.active && !isCampaignExpired(item));
}

export default function CampaignTicker() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/campaigns");
        const data = (await response.json()) as { campaigns?: Campaign[] };
        if (!cancelled) setCampaigns(liveCampaigns(data.campaigns ?? []));
      } catch {
        if (!cancelled) setCampaigns([]);
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (campaigns.length === 0) return null;

  const loop = [...campaigns, ...campaigns, ...campaigns];

  return (
    <div className="overflow-hidden bg-gold py-1.5 text-white">
      <div className="campaign-ticker-track flex w-max items-center gap-10 whitespace-nowrap text-xs font-semibold uppercase tracking-wide sm:text-[13px]">
        {loop.map((item, index) => {
          const content = (
            <span key={`${item.id}-${index}`} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              {item.message}
            </span>
          );
          return item.href ? (
            <a key={`${item.id}-${index}`} href={item.href} className="hover:underline">
              {content}
            </a>
          ) : (
            content
          );
        })}
      </div>
    </div>
  );
}
