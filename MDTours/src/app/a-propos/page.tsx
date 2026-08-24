import Image from "next/image";
import Header from "@/components/Header";
import PageHero from "@/components/PageHero";
import TrustBadges from "@/components/TrustBadges";
import { getAboutPage } from "@/lib/store";

export default async function AboutPage() {
  const page = await getAboutPage();

  return (
    <main className="min-h-screen bg-white">
      <Header variant="solid" />
      <PageHero kicker={page.kicker} title={page.title} subtitle={page.subtitle} />
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {page.blocks.map((block) => {
          if (block.type === "heading") {
            return (
              <h2 key={block.id} className="mt-10 text-2xl font-bold text-navy first:mt-0">
                {block.text}
              </h2>
            );
          }
          if (block.type === "image" && block.image) {
            return (
              <figure key={block.id} className="mt-8">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                  <Image
                    src={block.image}
                    alt={block.caption || page.title}
                    fill
                    className="object-cover"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="mt-2 text-center text-xs text-gray-500">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          }
          return (
            <p key={block.id} className="mt-6 text-base leading-relaxed text-gray-600 first:mt-0 first:text-lg">
              {block.text}
            </p>
          );
        })}
      </article>
      <TrustBadges />
    </main>
  );
}
