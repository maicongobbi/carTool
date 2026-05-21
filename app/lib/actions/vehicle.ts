"use server";

import { auth } from "@/app/lib/auth";
import { getEnhancedPrisma, prisma } from "@/app/lib/db";
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
  notes?: string[];
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

export async function transferVehicle(vehicleId: string, newUserId: string, saleDateInput: string | Date) {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autorizado");
  }

  const currentUserId = session.user.id;

  // 1. Verificar se o veículo pertence ao usuário atual (segurança)
  const oldVehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId: currentUserId,
    },
    include: {
      maintenanceCategories: true,
      technicalInfos: true,
      maintenanceRecords: true,
    },
  });

  if (!oldVehicle) {
    throw new Error("Veículo não encontrado ou você não tem permissão para transferi-lo.");
  }

  // 2. Marcar data da venda no veículo do dono antigo
  const parsedSaleDate = new Date(saleDateInput);
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { saleDate: parsedSaleDate },
  });

  // 3. Criar o veículo clonado para o novo dono
  const newVehicle = await prisma.vehicle.create({
    data: {
      type: oldVehicle.type,
      brand: oldVehicle.brand,
      model: oldVehicle.model,
      year: oldVehicle.year,
      modelYear: oldVehicle.modelYear,
      purchasePrice: oldVehicle.purchasePrice,
      purchaseDate: parsedSaleDate, // data de compra do novo é a data de venda do antigo
      initialKm: oldVehicle.currentKm, // KM inicial é o KM atual no ato da venda
      currentKm: oldVehicle.currentKm,
      fipeCode: oldVehicle.fipeCode,
      notes: oldVehicle.notes,
      userId: newUserId,
    },
  });

  // 4. Copiar as categorias
  const categoryIdMap = new Map<string, string>();
  for (const cat of oldVehicle.maintenanceCategories) {
    const newCat = await prisma.maintenanceCategory.create({
      data: {
        name: cat.name,
        vehicleId: newVehicle.id,
      },
    });
    categoryIdMap.set(cat.id, newCat.id);
  }

  // 5. Copiar as referências técnicas (plano de manutenção)
  const techInfoIdMap = new Map<string, string>();
  for (const tech of oldVehicle.technicalInfos) {
    const newCategoryId = categoryIdMap.get(tech.categoryId);
    if (!newCategoryId) continue;

    const newTech = await prisma.technicalInfo.create({
      data: {
        description: tech.description,
        notes: tech.notes,
        kmInterval: tech.kmInterval,
        timeIntervalMonths: tech.timeIntervalMonths,
        categoryId: newCategoryId,
        vehicleId: newVehicle.id,
      },
    });
    techInfoIdMap.set(tech.id, newTech.id);
  }

  // 6. Copiar o histórico de manutenções (marcando como previousOwner)
  for (const rec of oldVehicle.maintenanceRecords) {
    const newCategoryId = categoryIdMap.get(rec.categoryId);
    if (!newCategoryId) continue;

    const newTechInfoId = rec.technicalInfoId ? techInfoIdMap.get(rec.technicalInfoId) : null;

    await prisma.maintenanceRecord.create({
      data: {
        date: rec.date,
        kmAtService: rec.kmAtService,
        description: rec.description,
        cost: rec.cost,
        nextDate: rec.nextDate,
        nextKm: rec.nextKm,
        observations: rec.observations,
        attachments: rec.attachments,
        ignored: rec.ignored,
        previousOwner: true, // histórico herdado do proprietário anterior
        categoryId: newCategoryId,
        vehicleId: newVehicle.id,
        technicalInfoId: newTechInfoId || undefined,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/veiculos/${vehicleId}`);
  revalidatePath("/home");

  return { success: true, newVehicleId: newVehicle.id };
}