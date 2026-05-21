-- AlterTable
ALTER TABLE "MaintenanceRecord" ADD COLUMN     "previousOwner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "notes" DROP DEFAULT;
