-- AlterTable: add Google OAuth fields to usuarios
ALTER TABLE "usuarios" ADD COLUMN "googleId" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "imagen" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "primera_vez" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_googleId_key" ON "usuarios"("googleId");
