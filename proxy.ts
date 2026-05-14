import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Verifica o cookie de sessão padrão gerado pelo BetterAuth
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  // Se tentar acessar as rotas protegidas sem sessão, redireciona para o login
  if (!sessionToken && request.nextUrl.pathname.startsWith("/home")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!sessionToken && request.nextUrl.pathname.startsWith("/veiculos")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home", "/home/:path*", "/veiculos/:path*"],
};
