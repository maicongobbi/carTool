"use server";

import { auth } from "@/app/lib/auth";
import { getEnhancedPrisma } from "@/app/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type VehicleInput = {
  brand: string;
  model: string;
  year: number;
  purchasePrice?: number;
  initialKm: number;
  currentKm?: number;
  fipeCode?: string;
  notes?: string;
};

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function createVehicle(data: VehicleInput) {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  const db = await getEnhancedPrisma(session);

  const vehicle = await db.vehicle.create({
    data: {
      ...data,
      userId: session.user.id,
      currentKm: data.currentKm || data.initialKm,
    },
  });

  revalidatePath("/dashboard");
  return vehicle;
}

export async function getVehicles() {
  const session = await getSession();
  if (!session) return [];

  const db = await getEnhancedPrisma(session);
  return await db.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });
}