-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('baja', 'media', 'alta');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('pendiente', 'en_progreso', 'completada');

-- CreateEnum
CREATE TYPE "EstadoValorizacion" AS ENUM ('en_elaboracion', 'enviada_cliente', 'aprobada', 'facturada');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('emitida', 'cobrada', 'vencida', 'anulada');

-- CreateEnum
CREATE TYPE "EstadoGarantia" AS ENUM ('retenida', 'en_gestion', 'recuperada');

-- CreateEnum
CREATE TYPE "TipoGarantia" AS ENUM ('fiel_cumplimiento', 'garantia_tecnica', 'retencion_contractual');

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "seccion" TEXT NOT NULL DEFAULT 'Sin seccion',
    "asignado_a" TEXT,
    "creado_por" TEXT NOT NULL,
    "fecha_limite" TIMESTAMP(3),
    "estado" "EstadoTarea" NOT NULL DEFAULT 'pendiente',
    "prioridad" "PrioridadTarea" NOT NULL DEFAULT 'media',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtareas" (
    "id" TEXT NOT NULL,
    "tarea_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subtareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_tarea" (
    "id" TEXT NOT NULL,
    "tarea_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_campo" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "clima" TEXT NOT NULL,
    "incidente" BOOLEAN NOT NULL DEFAULT false,
    "desc_incidente" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_campo" (
    "id" TEXT NOT NULL,
    "reporte_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "horas" INTEGER NOT NULL,

    CONSTRAINT "personal_campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos_campo" (
    "id" TEXT NOT NULL,
    "reporte_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "horas" INTEGER NOT NULL,

    CONSTRAINT "equipos_campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valorizaciones" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoValorizacion" NOT NULL DEFAULT 'en_elaboracion',
    "monto_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valorizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidas_valorizacion" (
    "id" TEXT NOT NULL,
    "valorizacion_id" TEXT NOT NULL,
    "letra" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "metrado" DECIMAL(65,30) NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "avance_pct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monto" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "partidas_valorizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "valorizacion_id" TEXT,
    "numero" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'emitida',
    "retencion_pct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monto_neto" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "metodo_pago" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garantias" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "tipo" "TipoGarantia" NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "porcentaje" DECIMAL(65,30) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoGarantia" NOT NULL DEFAULT 'retenida',
    "documento_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garantias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "registro_id" TEXT,
    "detalle" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignado_a_fkey" FOREIGN KEY ("asignado_a") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtareas" ADD CONSTRAINT "subtareas_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_tarea" ADD CONSTRAINT "comentarios_tarea_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_tarea" ADD CONSTRAINT "comentarios_tarea_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_campo" ADD CONSTRAINT "reportes_campo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_campo" ADD CONSTRAINT "personal_campo_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "reportes_campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_campo" ADD CONSTRAINT "equipos_campo_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "reportes_campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valorizaciones" ADD CONSTRAINT "valorizaciones_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas_valorizacion" ADD CONSTRAINT "partidas_valorizacion_valorizacion_id_fkey" FOREIGN KEY ("valorizacion_id") REFERENCES "valorizaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_valorizacion_id_fkey" FOREIGN KEY ("valorizacion_id") REFERENCES "valorizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garantias" ADD CONSTRAINT "garantias_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
