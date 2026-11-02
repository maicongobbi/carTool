import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // O login continua no Better Auth do próprio app (tabelas User/Session/Account no Postgres).
  buckets: {
    // Anexos das manutenções. Privado: leitura via URL assinada gerada pelo servidor.
    "maintenance-attachments": { access: "private" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
