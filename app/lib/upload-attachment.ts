type SignedUpload =
  | { method: "PUT"; url: string; headers?: Record<string, string> }
  | { method: "POST"; url: string; fields: Record<string, string> };

// Envia um anexo para o Neon Object Storage e retorna a URL a gravar
// em MaintenanceRecord.attachments (ex.: /api/attachments/<veiculo>/<arquivo>).
export async function uploadAttachment(vehicleId: string, file: File): Promise<string> {
  const res = await fetch("/api/attachments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vehicleId, contentType: file.type, size: file.size }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "Erro ao preparar upload do anexo");
  }

  const upload = data.upload as SignedUpload;
  let sent: Response;
  if (upload.method === "POST") {
    const form = new FormData();
    for (const [name, value] of Object.entries(upload.fields)) form.append(name, value);
    form.append("file", file); // o arquivo precisa ser o último campo
    sent = await fetch(upload.url, { method: "POST", body: form });
  } else {
    sent = await fetch(upload.url, { method: "PUT", headers: upload.headers, body: file });
  }

  if (!sent.ok) {
    throw new Error("Erro ao fazer upload do anexo");
  }
  return data.url as string;
}
