import { auth } from "@/app/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Cria o catch-all handler de API requerido pelo Better Auth
export const { GET, POST } = toNextJsHandler(auth);