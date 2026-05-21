-- Migration: Vehicle.notes String? → String[]
-- Converte a coluna de texto simples para array de texto.
-- Registros que tinham nota são transformados em array de 1 elemento; nulos viram array vazio.

ALTER TABLE "Vehicle"
  ALTER COLUMN "notes" TYPE TEXT[]
  USING CASE
    WHEN "notes" IS NULL THEN ARRAY[]::TEXT[]
    ELSE ARRAY["notes"]
  END;

ALTER TABLE "Vehicle" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Vehicle" ALTER COLUMN "notes" SET NOT NULL;
