import { attachmentFiles, authorizeVehicle } from "@/app/lib/storage";

// Abre um anexo: confere se o veículo é do usuário e redireciona
// para uma URL assinada de curta duração no bucket privado.
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/attachments/[...key]">,
) {
  const { key: segments } = await ctx.params;
  if (segments.length !== 2 || segments.some((s) => !s || s === "." || s === "..")) {
    return new Response("Not found", { status: 404 });
  }

  const [vehicleId] = segments;
  const session = await authorizeVehicle(request.headers, vehicleId);
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const key = segments.join("/");
  const files = attachmentFiles();
  if (!(await files.exists(key))) {
    return new Response("Not found", { status: 404 });
  }

  const url = await files.url(key, {
    expiresIn: 300,
    responseContentDisposition: "inline",
  });

  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "private, no-store" },
  });
}
