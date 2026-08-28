import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const reporte = await prisma.reporteMalla.findUnique({ where: { id } })
  if (!reporte) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(reporte)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    const b = await req.json()

    const reporte = await prisma.reporteMalla.update({
      where: { id },
      data: {
        ...(b.codigo !== undefined                && { codigo: b.codigo.trim() }),
        ...(b.version !== undefined               && { version: b.version.trim() }),
        ...(b.fecha_doc !== undefined             && { fecha_doc: b.fecha_doc.trim() }),
        ...(b.especialista !== undefined          && { especialista: b.especialista?.trim() || null }),
        ...(b.contratista !== undefined           && { contratista: b.contratista?.trim() || null }),
        ...(b.entidad !== undefined               && { entidad: b.entidad?.trim() || null }),
        ...(b.ubicacion !== undefined             && { ubicacion: b.ubicacion?.trim() || null }),
        ...(b.estructura !== undefined            && { estructura: b.estructura?.trim() || null }),
        ...(b.fecha !== undefined                 && { fecha: b.fecha?.trim() || null }),
        ...(b.n_registro !== undefined            && { n_registro: b.n_registro?.trim() || null }),
        ...(b.plano_referencial !== undefined     && { plano_referencial: b.plano_referencial?.trim() || null }),
        ...(b.nivel_corona !== undefined          && { nivel_corona: b.nivel_corona?.trim() || null }),
        ...(b.nivel_pie_talud !== undefined       && { nivel_pie_talud: b.nivel_pie_talud?.trim() || null }),
        ...(b.n_columnas_malla !== undefined      && { n_columnas_malla: b.n_columnas_malla?.trim() || null }),
        ...(b.malla_tipo !== undefined            && { malla_tipo: b.malla_tipo?.trim() || null }),
        ...(b.malla_marca !== undefined           && { malla_marca: b.malla_marca?.trim() || null }),
        ...(b.malla_abertura !== undefined        && { malla_abertura: b.malla_abertura?.trim() || null }),
        ...(b.malla_diametro_alambre !== undefined && { malla_diametro_alambre: b.malla_diametro_alambre?.trim() || null }),
        ...(b.malla_tipo_union !== undefined      && { malla_tipo_union: b.malla_tipo_union?.trim() || null }),
        ...(b.malla_norma !== undefined           && { malla_norma: b.malla_norma?.trim() || null }),
        ...(b.alambre_material !== undefined      && { alambre_material: b.alambre_material?.trim() || null }),
        ...(b.alambre_diametro !== undefined      && { alambre_diametro: b.alambre_diametro?.trim() || null }),
        ...(b.alambre_tension_rotura !== undefined && { alambre_tension_rotura: b.alambre_tension_rotura?.trim() || null }),
        ...(b.grapas_material !== undefined       && { grapas_material: b.grapas_material?.trim() || null }),
        ...(b.grapas_diametro !== undefined       && { grapas_diametro: b.grapas_diametro?.trim() || null }),
        ...(b.grapas_tuercas !== undefined        && { grapas_tuercas: b.grapas_tuercas?.trim() || null }),
        ...(b.inst_fecha !== undefined            && { inst_fecha: b.inst_fecha?.trim() || null }),
        ...(b.inst_ancho_rollo !== undefined      && { inst_ancho_rollo: b.inst_ancho_rollo?.trim() || null }),
        ...(b.inst_altura_rollo_fab !== undefined && { inst_altura_rollo_fab: b.inst_altura_rollo_fab?.trim() || null }),
        ...(b.inst_long_prot_ini !== undefined    && { inst_long_prot_ini: b.inst_long_prot_ini?.trim() || null }),
        ...(b.inst_altura_prot_ini !== undefined  && { inst_altura_prot_ini: b.inst_altura_prot_ini?.trim() || null }),
        ...(b.inst_long_prot_fin !== undefined    && { inst_long_prot_fin: b.inst_long_prot_fin?.trim() || null }),
        ...(b.inst_altura_prot_fin !== undefined  && { inst_altura_prot_fin: b.inst_altura_prot_fin?.trim() || null }),
        ...(b.inst_area_protegida !== undefined   && { inst_area_protegida: b.inst_area_protegida?.trim() || null }),
        ...(b.inst_uso_grapas !== undefined       && { inst_uso_grapas: b.inst_uso_grapas?.trim() || null }),
        ...(b.representante_sr !== undefined      && { representante_sr: b.representante_sr?.trim() || null }),
        ...(b.representante_contratista !== undefined && { representante_contratista: b.representante_contratista?.trim() || null }),
        ...(b.logo_sr_path !== undefined          && { logo_sr_path: b.logo_sr_path }),
        ...(b.logo_cliente_path !== undefined     && { logo_cliente_path: b.logo_cliente_path }),
        ...(b.foto_registro_1_path !== undefined  && { foto_registro_1_path: b.foto_registro_1_path }),
        ...(b.foto_registro_2_path !== undefined  && { foto_registro_2_path: b.foto_registro_2_path }),
        ...(b.elevacion_path !== undefined        && { elevacion_path: b.elevacion_path }),
      },
    })

    return NextResponse.json(reporte)
  } catch (err) {
    console.error('[PATCH /api/reportes-malla/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar reporte' }, { status: 500 })
  }
}
