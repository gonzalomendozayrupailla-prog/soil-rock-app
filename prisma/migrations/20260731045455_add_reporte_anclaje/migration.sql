-- CreateTable
CREATE TABLE "reportes_anclaje" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT NOT NULL DEFAULT '',
    "metodologia" TEXT NOT NULL DEFAULT '',
    "sistema" TEXT NOT NULL DEFAULT '',
    "martillo_dth" TEXT NOT NULL DEFAULT '',
    "diametro_casing" TEXT NOT NULL DEFAULT '',
    "descripcion_suelo" TEXT,
    "observaciones" TEXT,
    "perforadora_hidraulica" TEXT,
    "compresora_aire" TEXT,
    "supervisor" TEXT,
    "oper_perforista" TEXT,
    "oper_compresorista" TEXT,
    "oficial_1" TEXT,
    "ayudante_1" TEXT,
    "ayudante_2" TEXT,
    "anclajes_perforados" INTEGER NOT NULL DEFAULT 0,
    "anclajes_acumulados" INTEGER NOT NULL DEFAULT 0,
    "anclajes" JSONB NOT NULL DEFAULT '[]',
    "logo_sr_path" TEXT,
    "logo_cliente_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_anclaje_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reportes_anclaje" ADD CONSTRAINT "reportes_anclaje_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
