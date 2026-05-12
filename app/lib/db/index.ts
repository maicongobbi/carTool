
import { enhance } from "@zenstackhq/runtime";
import { prisma } from "./prisma";

// Esta função aprimora o cliente Prisma com o motor de políticas do ZenStack.
// É crucial para multi-tenancy e controle de acesso.
export async function getEnhancedPrisma(session: any) { // 'any' por enquanto, pode ser tipado futuramente
  return enhance(prisma, { user: session?.user });
}

export { prisma };
