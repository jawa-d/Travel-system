import { auth } from "@/auth";
import { isDirectAccessEnabled } from "@/lib/direct-access";
import { NextResponse } from "next/server";

function requestOrigin(request: Parameters<Parameters<typeof auth>[0]>[0]) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProtocol ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

function loginRedirect(request: Parameters<Parameters<typeof auth>[0]>[0]) {
  const loginUrl = new URL("/login", requestOrigin(request));
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);

  // Remove stale Auth.js/NextAuth cookies so an invalid JWT cannot cause a
  // redirect-render-refresh loop between the proxy and protected pages.
  [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token"
  ].forEach((name) => response.cookies.delete(name));

  return response;
}

export default auth(async (request) => {
  const isLoggedIn = Boolean(request.auth);
  const isActive = request.auth?.user?.active !== false;
  const role = request.auth?.user?.role;
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/public/") || path.startsWith("/api/v1/public/")) {
    return NextResponse.next();
  }

  if (isDirectAccessEnabled() && !isLoggedIn) return;

  if (!isLoggedIn || !isActive) {
    return loginRedirect(request);
  }

  if (role === "AGENT" && !path.startsWith("/api/")) {
    const allowed =
      path === "/" ||
      path === "/access-denied" ||
      path === "/policies" ||
      path.startsWith("/policies/") ||
      path === "/policies/new" ||
      path === "/customers" ||
      path.startsWith("/customers/") ||
      path === "/claims" ||
      path === "/endorsements" ||
      path === "/cancellations";
    if (!allowed) {
      const deniedUrl = new URL("/access-denied", requestOrigin(request));
      deniedUrl.searchParams.set("from", `${request.nextUrl.pathname}${request.nextUrl.search}`);
      deniedUrl.searchParams.set("reason", "agent-route");
      return NextResponse.redirect(deniedUrl);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-current-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!api/auth(?:/|$)|api/public(?:/|$)|api/v1/public(?:/|$)|login(?:/|$)|verify(?:/|$)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"
  ]
};
