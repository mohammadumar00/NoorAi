/*
  Warnings:

  - The `embedding` column on the `Ayah` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Ayah" DROP COLUMN "embedding",
ADD COLUMN     "embedding" DOUBLE PRECISION[];
