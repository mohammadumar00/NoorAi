/*
  Warnings:

  - Made the column `audioUrl` on table `Ayah` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Ayah" ALTER COLUMN "audioUrl" SET NOT NULL;
