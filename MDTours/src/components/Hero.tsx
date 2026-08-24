import {
  ArrowRight,
  Facebook,
  Instagram,
  PlayCircle,
} from "lucide-react";
import Image from "next/image";
import Header from "./Header";
import SearchBar from "./SearchBar";
import { heroMedia } from "@/data/home";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: TikTokIcon, href: "#", label: "TikTok" },
];

export default function Hero() {
  return (
    <section className="relative">
      <div className="relative min-h-[20.5rem] overflow-hidden pb-20 sm:min-h-[28rem] sm:pb-24 lg:min-h-[78vh]">
      {heroMedia.video ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={heroMedia.image}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={heroMedia.video} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={heroMedia.image}
          alt="Amis sur une jetée face à la mer"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      <Header />

      <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 pb-10 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="max-w-2xl">
          <h1 className="text-[1.7rem] font-bold leading-tight text-white sm:text-4xl lg:text-[3.25rem] lg:leading-[1.15]">
            <span className="relative inline-block">
              Le guide de confiance.
              <span className="absolute -bottom-1 left-0 h-0.5 w-16 bg-white/60" />
            </span>
            <br />
            <span className="text-gold">Vivez l&apos;Afrique intensément.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:mt-5 sm:text-lg">
            Des expériences uniques, des souvenirs inoubliables et un
            accompagnement de qualité.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
            <a href="#reserver" className="btn-gold">
              Réserver maintenant
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/voyages" className="btn-outline-white">
              <PlayCircle className="h-5 w-5" />
              Découvrir nos voyages
            </a>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        {socialLinks.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/10 text-white backdrop-blur-sm transition-colors hover:border-gold hover:bg-gold/20 hover:text-gold"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>

      </div>

      <div className="relative z-40 -mt-12 px-3 sm:-mt-16 sm:px-6 lg:px-8">
        <SearchBar />
      </div>
    </section>
  );
}
