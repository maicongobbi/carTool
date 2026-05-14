import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// BetterAuth usa "better-auth.session_token" em HTTP local
// e "__Secure-better-auth.session_token" em HTTPS (produção)
function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value
  );
}

const PROTECTED_PREFIXES = ["/home", "/veiculos", "/dashboard"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !getSessionToken(request)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/veiculos/:path*", "/dashboard/:path*"],
};
