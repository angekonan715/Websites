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
    <section className="relative overflow-hidden px-6 pb-16 pt-10 text-white lg:px-8">
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
        <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-white/80">{subtitle}</p>
      </div>
    </section>
  );
}
