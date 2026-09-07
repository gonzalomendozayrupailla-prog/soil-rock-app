-- DropForeignKey
ALTER TABLE "auditoria_logs" DROP CONSTRAINT "auditoria_logs_usuario_id_fkey";

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
