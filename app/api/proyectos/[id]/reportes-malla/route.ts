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
  const reportes = await prisma.reporteMalla.findMany({
    where: { proyecto_id: id },
    select: { id: true, codigo: true, version: true, fecha_doc: true, n_registro: true, created_at: true },
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(reportes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const { id: proyecto_id } = await params
    const b = await req.json()

    if (!b.codigo?.trim()) {
      return NextResponse.json({ error: 'Codigo es requerido' }, { status: 400 })
    }

    const reporte = await prisma.reporteMalla.create({
      data: {
        proyecto_id,
        codigo:                   b.codigo.trim(),
        version:                  b.version?.trim() ?? '00',
        fecha_doc:                b.fecha_doc?.trim() ?? '',
        especialista:             b.especialista?.trim() || null,
        contratista:              b.contratista?.trim() || null,
        entidad:                  b.entidad?.trim() || null,
        ubicacion:                b.ubicacion?.trim() || null,
        estructura:               b.estructura?.trim() || null,
        fecha:                    b.fecha?.trim() || null,
        n_registro:               b.n_registro?.trim() || null,
        plano_referencial:        b.plano_referencial?.trim() || null,
        nivel_corona:             b.nivel_corona?.trim() || null,
        nivel_pie_talud:          b.nivel_pie_talud?.trim() || null,
        n_columnas_malla:         b.n_columnas_malla?.trim() || null,
        malla_tipo:               b.malla_tipo?.trim() || null,
        malla_marca:              b.malla_marca?.trim() || null,
        malla_abertura:           b.malla_abertura?.trim() || null,
        malla_diametro_alambre:   b.malla_diametro_alambre?.trim() || null,
        malla_tipo_union:         b.malla_tipo_union?.trim() || null,
        malla_norma:              b.malla_norma?.trim() || null,
        alambre_material:         b.alambre_material?.trim() || null,
        alambre_diametro:         b.alambre_diametro?.trim() || null,
        alambre_tension_rotura:   b.alambre_tension_rotura?.trim() || null,
        grapas_material:          b.grapas_material?.trim() || null,
        grapas_diametro:          b.grapas_diametro?.trim() || null,
        grapas_tuercas:           b.grapas_tuercas?.trim() || null,
        inst_fecha:               b.inst_fecha?.trim() || null,
        inst_ancho_rollo:         b.inst_ancho_rollo?.trim() || null,
        inst_altura_rollo_fab:    b.inst_altura_rollo_fab?.trim() || null,
        inst_long_prot_ini:       b.inst_long_prot_ini?.trim() || null,
        inst_altura_prot_ini:     b.inst_altura_prot_ini?.trim() || null,
        inst_long_prot_fin:       b.inst_long_prot_fin?.trim() || null,
        inst_altura_prot_fin:     b.inst_altura_prot_fin?.trim() || null,
        inst_area_protegida:      b.inst_area_protegida?.trim() || null,
        inst_uso_grapas:          b.inst_uso_grapas?.trim() || null,
        representante_sr:         b.representante_sr?.trim() || null,
        representante_contratista: b.representante_contratista?.trim() || null,
        logo_sr_path:             b.logo_sr_path ?? null,
        logo_cliente_path:        b.logo_cliente_path ?? null,
        foto_registro_1_path:     b.foto_registro_1_path ?? null,
        foto_registro_2_path:     b.foto_registro_2_path ?? null,
        elevacion_path:           b.elevacion_path ?? null,
      },
    })

    return NextResponse.json(reporte, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/reportes-malla]', err)
    return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 })
  }
}
