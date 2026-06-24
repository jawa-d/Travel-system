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

  if (isDirectAccessEnabled() && !isLoggedIn) return;

  if (!isLoggedIn || !isActive) {
    return loginRedirect(request);
  }

  if (role === "AGENT" && !path.startsWith("/api/")) {
    const allowed =
      path === "/" ||
      path === "/policies" ||
      path.startsWith("/policies/") ||
      path === "/policies/new" ||
      path === "/customers" ||
      path.startsWith("/customers/") ||
      path === "/claims" ||
      path === "/endorsements" ||
      path === "/cancellations";
    if (!allowed) return NextResponse.redirect(new URL("/policies/new", requestOrigin(request)));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth(?:/|$)|login(?:/|$)|verify(?:/|$)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"
  ]
};
