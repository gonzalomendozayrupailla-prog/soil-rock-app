-- CreateTable
CREATE TABLE "reportes_inyeccion" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT NOT NULL DEFAULT '',
    "metodologia" TEXT NOT NULL DEFAULT '',
    "fluido" TEXT NOT NULL DEFAULT '',
    "cemento" TEXT NOT NULL DEFAULT '',
    "aditivo" TEXT NOT NULL DEFAULT '',
    "descripcion_suelo" TEXT,
    "observaciones" TEXT,
    "central_inyeccion" TEXT,
    "supervisor" TEXT,
    "oper_perforista" TEXT,
    "oper_inyeccion" TEXT,
    "anclajes_inyectados" INTEGER NOT NULL DEFAULT 0,
    "anclajes_acumulados" INTEGER NOT NULL DEFAULT 0,
    "anclajes" JSONB NOT NULL DEFAULT '[]',
    "logo_sr_path" TEXT,
    "logo_cliente_path" TEXT,
    "esquema_path" TEXT,
    "supervisor_sr" TEXT,
    "supervisor_cliente" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_inyeccion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reportes_inyeccion" ADD CONSTRAINT "reportes_inyeccion_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
