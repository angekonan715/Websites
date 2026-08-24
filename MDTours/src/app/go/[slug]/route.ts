import { NextResponse } from "next/server";
import { buildShareRedirect } from "@/lib/shareLinks";
import { getShareLinks, saveShareLinks } from "@/lib/store";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const links = await getShareLinks();
  const link = links.find((item) => item.slug === slug && item.active);

  if (!link) {
    return NextResponse.redirect(new URL("/liens", request.url));
  }

  link.clicks += 1;
  link.lastClickedAt = new Date().toISOString();
  await saveShareLinks(links);

  const destination = buildShareRedirect(
    link.target,
    link.source,
    link.slug,
    new URL(request.url).origin
  );
  return NextResponse.redirect(destination);
}
