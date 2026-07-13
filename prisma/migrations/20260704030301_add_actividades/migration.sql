-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('nota', 'documento_recibido', 'documento_enviado', 'llamada', 'reunion', 'cambio_fase', 'propuesta_enviada', 'observacion_cliente');

-- AlterEnum
ALTER TYPE "FaseProyecto" ADD VALUE 'cancelado';

-- AlterTable
ALTER TABLE "proyectos" ALTER COLUMN "monto_contrato" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
