import Image from "next/image";
import { getHeroSettings } from "@/lib/store";

export default async function PageHero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  const media = await getHeroSettings();

  return (
    <section className="relative overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      {media.video ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={media.image}
          className="absolute inset-0 !h-full !w-full max-h-none min-h-full min-w-full object-cover object-center"
        >
          <source src={media.video} />
        </video>
      ) : (
        <Image
          src={media.image}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-navy/70" />
      <div className="relative mx-auto max-w-7xl text-center sm:text-left">
        <p className="section-kicker">{kicker}</p>
        <h1 className="mt-3 max-w-3xl font-editorial text-4xl font-semibold leading-tight sm:mt-4 sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:mx-0 sm:mt-5 sm:text-lg">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
