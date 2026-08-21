import Image from "next/image";
import { heroMedia } from "@/data/home";

export default function PageHero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <Image
        src={heroMedia.image}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-navy/65" />
      <div className="relative mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
          {kicker}
        </p>
        <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-tight sm:mt-3 sm:text-3xl lg:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:mt-3 sm:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
