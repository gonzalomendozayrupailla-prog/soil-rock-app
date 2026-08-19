-- AlterTable
ALTER TABLE "documentos" ADD COLUMN     "carpeta_id" TEXT;

-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'PEN';

-- CreateTable
CREATE TABLE "carpetas_documento" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "modulo" TEXT NOT NULL DEFAULT 'documentos',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carpetas_documento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "carpetas_documento" ADD CONSTRAINT "carpetas_documento_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_carpeta_id_fkey" FOREIGN KEY ("carpeta_id") REFERENCES "carpetas_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
