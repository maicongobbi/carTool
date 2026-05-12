import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Opcional: Define a URL base (útil quando subir para produção)
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, useSession } = authClient;