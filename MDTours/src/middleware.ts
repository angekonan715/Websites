import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = request.nextUrl.clone();
      const next = `${pathname}${request.nextUrl.search}`;
      url.pathname = "/connexion";
      url.search = "";
      url.searchParams.set("next", next || "/admin");
      return NextResponse.redirect(url);
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (pathname.startsWith("/reservations") && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/temoignages/nouveau") && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (pathname === "/voyage-personnalise/demandes") {
    return NextResponse.redirect(new URL("/voyage-personnalise", request.url));
  }

  if (pathname.startsWith("/voyage-personnalise/") && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/reservations",
    "/reservations/:path*",
    "/temoignages/nouveau",
    "/voyage-personnalise/:path*",
  ],
};
