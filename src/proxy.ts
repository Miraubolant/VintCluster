import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Domaine admin (configurable via env)
const ADMIN_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || "localhost:3000";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Mise à jour session Supabase
  const { supabaseResponse, user } = await updateSession(request);

  // Protection des routes /admin/*
  if (pathname.startsWith("/admin")) {
    // Vérifier si on est sur le domaine admin ou localhost
    const isAdminDomain =
      host === ADMIN_DOMAIN ||
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1");

    if (!isAdminDomain) {
      // Rediriger vers 404 si accès admin depuis un autre domaine
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }

    // Vérifier authentification (sauf pour /admin/login)
    if (!pathname.startsWith("/admin/login") && !user) {
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Si déjà connecté et sur /admin/login, rediriger vers dashboard
    if (pathname === "/admin/login" && user) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Injecter le host dans les headers pour les server components
  supabaseResponse.headers.set("x-current-host", host);

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
