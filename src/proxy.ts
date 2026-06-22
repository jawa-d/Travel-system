import { auth } from "@/auth";
import { isDirectAccessEnabled } from "@/lib/direct-access";

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const isActive = request.auth?.user?.active !== false;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const role = request.auth?.user?.role;
  const path = request.nextUrl.pathname;

  if (isDirectAccessEnabled() && !isLoggedIn) return;

  if ((!isLoggedIn || !isActive) && !isAuthPage) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL("/", request.nextUrl.origin));
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
    if (!allowed) return Response.redirect(new URL("/policies/new", request.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|verify|_next/static|_next/image|favicon.ico).*)"]
};
