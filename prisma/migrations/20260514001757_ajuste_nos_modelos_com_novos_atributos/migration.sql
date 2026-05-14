-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "modelYear" INTEGER,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Carro';
