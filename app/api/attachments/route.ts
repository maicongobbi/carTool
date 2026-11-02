import { randomUUID } from "node:crypto";
import {
  ALLOWED_ATTACHMENT_TYPES,
  ATTACHMENT_URL_PREFIX,
  MAX_ATTACHMENT_BYTES,
  attachmentFiles,
  authorizeVehicle,
} from "@/app/lib/storage";

// Gera uma URL assinada para o navegador enviar o anexo direto ao bucket.
// Assim o arquivo não passa pela função do Vercel (limite de ~4,5 MB no corpo).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const vehicleId = typeof body?.vehicleId === "string" ? body.vehicleId : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  const ext = ALLOWED_ATTACHMENT_TYPES[contentType];
  if (!vehicleId || !ext) {
    return Response.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }
  if (size <= 0 || size > MAX_ATTACHMENT_BYTES) {
    return Response.json({ error: "Arquivo deve ter no máximo 15 MB" }, { status: 400 });
  }

  const session = await authorizeVehicle(request.headers, vehicleId);
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const key = `${vehicleId}/${Date.now()}-${randomUUID()}.${ext}`;
  const upload = await attachmentFiles().signedUploadUrl(key, {
    expiresIn: 300,
    contentType,
    maxSize: MAX_ATTACHMENT_BYTES,
  });

  return Response.json({ upload, url: `${ATTACHMENT_URL_PREFIX}${key}` });
}
