-- Migration: MaintenanceCategory agora pertence a um Vehicle (não mais ao User)
-- Para registros existentes, associamos ao primeiro veículo do usuário dono da categoria.
-- Categorias de usuários sem veículos são removidas.

-- 1. Adiciona a coluna como nullable primeiro
ALTER TABLE "MaintenanceCategory" ADD COLUMN "vehicleId" TEXT;

-- 2. Preenche vehicleId com o primeiro veículo de cada usuário dono da categoria
UPDATE "MaintenanceCategory" mc
SET "vehicleId" = (
  SELECT v.id
  FROM "Vehicle" v
  WHERE v."userId" = mc."userId"
  ORDER BY v."createdAt" ASC
  LIMIT 1
);

-- 3. Remove categorias que ficaram sem veículo (usuário não tem veículos)
DELETE FROM "MaintenanceCategory" WHERE "vehicleId" IS NULL;

-- 4. Torna a coluna NOT NULL
ALTER TABLE "MaintenanceCategory" ALTER COLUMN "vehicleId" SET NOT NULL;

-- 5. Adiciona a foreign key
ALTER TABLE "MaintenanceCategory"
  ADD CONSTRAINT "MaintenanceCategory_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Remove a coluna userId e sua foreign key antiga
ALTER TABLE "MaintenanceCategory" DROP CONSTRAINT IF EXISTS "MaintenanceCategory_userId_fkey";
ALTER TABLE "MaintenanceCategory" DROP COLUMN "userId";
