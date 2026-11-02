import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";
import { auth } from "./auth";
import { getEnhancedPrisma } from "./db";

// Bucket do Neon Object Storage declarado em neon.ts.
// Endpoint, região e credenciais vêm das variáveis AWS_* injetadas pelo Neon.
export const ATTACHMENTS_BUCKET = "maintenance-attachments";

export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/pdf": "pdf",
};

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

// Prefixo das URLs gravadas em MaintenanceRecord.attachments.
export const ATTACHMENT_URL_PREFIX = "/api/attachments/";

let files: Files | undefined;

// Criado sob demanda para não exigir as variáveis AWS_* durante o build.
export function attachmentFiles(): Files {
  files ??= new Files({ adapter: neon({ bucket: ATTACHMENTS_BUCKET }) });
  return files;
}

// Retorna o usuário logado se o veículo pertence a ele; caso contrário, null.
// A checagem usa as políticas do ZenStack (Vehicle só é visível para o dono).
export async function authorizeVehicle(headers: Headers, vehicleId: string) {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const db = await getEnhancedPrisma(session);
  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  return vehicle ? session : null;
}
