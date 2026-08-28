/*
  Warnings:

  - You are about to drop the column `foto_registro_path` on the `reportes_malla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reportes_malla" DROP COLUMN "foto_registro_path",
ADD COLUMN     "foto_registro_1_path" TEXT,
ADD COLUMN     "foto_registro_2_path" TEXT;
