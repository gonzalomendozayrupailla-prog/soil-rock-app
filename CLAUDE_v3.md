# CLAUDE.md — Sistema de Gestión Soil Rock (v3)

## Visión del producto

Sistema web de gestión integral para empresas de ingeniería geotécnica.
Cubre desde el primer contacto comercial hasta el cierre financiero del proyecto.
Diseñado para equipos de 5 a 50 personas.

**Referentes de UX/UI:**
- Lado comercial → imitar Pipedrive (pipeline visual, detalle de deal, actividad, archivos)
- Lado operativo → imitar Asana (tareas por secciones, lista/board, timeline, "Mis tareas")
- Adaptado al lenguaje y procesos de ingeniería geotécnica en Perú

---

## Stack tecnológico — NO cambiar

- Next.js 16 + TypeScript + Tailwind CSS 4
- PostgreSQL + Prisma 7
- Supabase (São Paulo) — base de datos + archivos
- GitHub + Vercel
- @tabler/icons-react

---

## Paleta de colores

| Uso | Color |
|-----|-------|
| Azul principal | #004aad |
| Azul claro | #0ca3df |
| Gris | #5b5b5b |
| Negro | #1a1d1e |
| Fondo general | #f4f6f8 |
| Sidebar/cards | #ffffff |
| Bordes | 0.5px solid #e8eaed |
| Item activo sidebar | bg #e8f0fd, color #004aad |

---

## Sidebar global

```
Principal
  ├── Dashboard
  └── Mis tareas (estilo Asana — solo tareas del usuario logueado)

Comercial
  ├── Pipeline (estilo Pipedrive — kanban de oportunidades)
  └── Clientes

Operaciones
  └── Proyectos

General
  ├── Usuarios (solo gerente)
  ├── Configuración
  └── Cerrar sesión
```

No hay módulos sueltos. Documentos, campo, valorizaciones, facturación se acceden desde dentro del proyecto.

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| gerente | Todo el sistema |
| ingeniero_residente | Sus proyectos, tareas, documentos, campo |
| administrativo | Documentos, facturación, garantías |
| campo | Solo reporte diario desde celular |

Permisos granulares por usuario (JSON switches):
ver_proyectos, editar_proyectos, ver_documentos, subir_documentos,
ver_reportes_campo, editar_reportes_campo, ver_valorizaciones,
editar_valorizaciones, ver_facturas, ver_garantias, ver_dashboard, ver_montos

---

# LADO COMERCIAL (imitar Pipedrive)

## Pipeline — /dashboard/pipeline

### Vista principal: Kanban
Exactamente como Pipedrive: tablero visual con drag-and-drop.

**Columnas:**
- Contacto (fase: pre_proyecto)
- Propuesta enviada (fase: propuesta)
- Negociación (fase: negociacion)
- Adjudicado (fase: adjudicado)

**Cada tarjeta muestra:**
- Nombre de la oportunidad
- Cliente (razón social)
- Monto estimado (si tiene)
- Días en la etapa actual (como Pipedrive "deal rotting")
- Ícono de actividad programada pendiente (si tiene)
- Contacto principal

**Tarjetas envejecidas:** si llevan más de 7 días sin actividad, se marcan con borde amarillo. Si llevan más de 14 días, se marcan en rojo. (Pipedrive "deal rotting")

**Secciones debajo del kanban:**
- En pausa — oportunidades congeladas con botón "Reactivar"
- Perdidas — oportunidades perdidas con motivo y botón "Reabrir"

**Barra superior:**
- Botón "+ Nueva oportunidad"
- Buscador
- Resumen: X oportunidades | Valor total S/ XXX | En negociación S/ XXX

### Crear nueva oportunidad
Modal con campos:
- Nombre de la oportunidad (requerido)
- Cliente: dropdown + "+ Crear nuevo cliente" (inline: razón social, RUC, sector, dirección)
- Contacto: dropdown de contactos del cliente + "+ Agregar contacto" (inline: nombre, cargo, email, teléfono)
- Sector (requerido)
- Monto estimado (OPCIONAL — placeholder "Se definirá después")
- Fecha inicio (requerido)
- Ingeniero responsable (opcional en esta etapa)

### Detalle de oportunidad (estilo Pipedrive deal detail)
Al hacer clic en una tarjeta se abre la vista detalle.

**Barra de progreso arriba** (como Pipedrive): muestra las etapas como círculos conectados, resaltando la etapa actual y mostrando los días en cada etapa.

Contacto → Propuesta → Negociación → Adjudicado
   3 días      5 días      ● actual

**Panel izquierdo (30% ancho) — Datos:**
- Nombre
- Monto (editable en línea)
- Cliente + contacto (con link al detalle del cliente)
- Sector
- Ingeniero responsable
- Fecha creación
- Fecha cierre estimada

**Panel derecho (70% ancho) — Tabs:**

Tab "Actividad" (default, como Pipedrive):
- Timeline cronológico de todo lo que pasó
- Formulario rápido arriba: tipo (nota, llamada, reunión, email), descripción, botón Agregar
- Cada entrada: ícono + tipo + descripción + quién + cuándo
- Los cambios de fase se registran automáticamente
- Las subidas de documentos se registran automáticamente
- Programar próxima actividad: tipo, fecha, descripción (pendiente de implementar)

Tab "Documentos":
- Sub-tabs: "Del cliente" | "Nuestros"
- Del cliente: estados pendiente_revision → revisado
- Nuestros: estados borrador → enviado_cliente → con_observaciones → aprobado
- Botón "Subir documento" con selector de categoría
- Cada documento: ícono tipo archivo, nombre, versión, estado badge, fecha, quién, botón descargar

Tab "Notas" (texto libre, como Pipedrive):
- Lista de notas con fecha y autor
- Editor simple para agregar notas

**Botones de transición de fase** (arriba, junto al progreso):
- pre_proyecto → "Enviar propuesta"
- propuesta → "Iniciar negociación"
- negociacion → "Adjudicar" | "Pausar" | "Perdido" (pide motivo)
- en_pausa → "Reactivar"
- adjudicado → "Iniciar proyecto" (pide monto si no tiene)

---

## Clientes — /dashboard/clientes

**Lista:**
- Tabla con: razón social, RUC, sector, contactos (cantidad), proyectos (cantidad)
- Buscador por nombre o RUC
- Botón "+ Nuevo cliente"

**Detalle de cliente:**
- Datos del cliente (editable)
- Lista de contactos (agregar/editar/desactivar)
- Historial: todos los proyectos/oportunidades de ese cliente con fase y monto
- Estadísticas: total proyectos, ganados vs perdidos, monto total

---

# LADO OPERATIVO (imitar Asana)

## Proyectos — /dashboard/proyectos

Solo muestra proyectos con fase: adjudicado, ejecucion, cierre, cerrado, cancelado.

### Panel izquierdo — Lista de proyectos

**Filtros como tabs:**
- Todos
- Por iniciar (adjudicado)
- En ejecución
- En cierre
- Cerrados
- Cancelados

Cada tab muestra el conteo.

**Cada item muestra:**
- Código GEO-YYYY-NNN
- Nombre
- Cliente
- Badge de fase
- Barra de avance (calculada de tareas)
- Ingeniero responsable

**Buscador** por código y nombre.
**Botón** "+ Nuevo proyecto" (redirige al pipeline para crear oportunidad).

### Vista unificada del proyecto — /dashboard/proyectos/[id]

Al hacer clic en un proyecto se abre la misma vista que en Pipeline pero con tabs adicionales.

**Siempre visibles:**

Tab "Resumen":
- Datos generales (nombre, código, cliente, ingeniero, monto, fechas)
- KPIs del proyecto: tareas pendientes, documentos por revisar, última actividad
- Botón editar cada campo

Tab "Tareas" (estilo Asana):
Ver sección detallada abajo.

Tab "Documentos":
Mismo que en Pipeline. Del cliente + Nuestros.

Tab "Actividad":
Mismo timeline que en Pipeline. Se acumula todo el historial desde el primer contacto.

**Solo en fases operativas (adjudicado en adelante):**

Tab "Campo":
Ver sección detallada abajo.

Tab "Valorizaciones":
Ver sección detallada abajo.

Tab "Facturación":
Ver sección detallada abajo.

---

## Tareas — estilo Asana

### Dentro de cada proyecto (Tab "Tareas")

**Tres vistas switcheables** (como Asana):

**Vista Lista (default):**
Tareas organizadas por secciones (como Asana sections):
- Planificación
- En campo
- En oficina
- Entregables
- Revisión
(Las secciones son personalizables por proyecto)

Cada tarea muestra en línea:
- Checkbox de completado
- Título
- Asignado a (avatar + nombre)
- Fecha límite
- Prioridad (badge: baja/media/alta)
- Estado (badge: pendiente/en progreso/completada)
- Tiempo en estado actual (ej: "3 días en progreso")

**Vista Board (kanban):**
Columnas = estados: Pendiente → En progreso → Completada
Arrastrar tareas entre columnas.

**Vista Timeline:**
Gantt simple con fecha inicio y fin de cada tarea.
Dependencias visuales (tarea B no puede iniciar hasta que A termine).

### Crear tarea

- Título (requerido)
- Descripción (editor de texto)
- Sección del proyecto (dropdown)
- Asignado a: uno o varios usuarios
- Fecha límite
- Prioridad: baja | media | alta
- Subtareas (lista de items dentro de la tarea)
- Documentos adjuntos (vinculados a documentos del proyecto)
- Comentarios (hilo de conversación por tarea)

### Detalle de tarea (panel lateral como Asana)

Al hacer clic en una tarea se abre panel lateral derecho sin salir de la lista:
- Título editable
- Descripción
- Asignado a
- Fecha límite con calendario
- Prioridad
- Estado con botones de transición
- Tiempo en estado actual
- Subtareas con checkbox
- Comentarios
- Historial de cambios

### "Mis tareas" — /dashboard/mis-tareas (estilo Asana My Tasks)

Vista personal del usuario logueado. Muestra TODAS sus tareas de TODOS los proyectos.

**Agrupadas por:**
- Hoy (vencen hoy)
- Esta semana
- Próximamente
- Sin fecha

O agrupadas por:
- Proyecto
- Prioridad
- Estado

**Indicador en sidebar:** badge con número de tareas pendientes.

El gerente puede ver "Mis tareas" de cualquier ingeniero para supervisar.

---

## Campo — Tab dentro del proyecto

### Reportes de campo (formulario mobile-first)

Cada reporte documenta un día de trabajo en campo:
- Fecha
- Proyecto (preseleccionado)
- Usuario que reporta
- Descripción del avance
- Clima: soleado, nublado, lluvia, tormenta (selector de íconos)
- Personal en campo: nombre, rol en obra (peón, operador, topógrafo, ingeniero), horas
- Equipos utilizados: tipo, horas de uso
- Incidentes: ¿hubo? descripción
- Fotos: subida directa desde celular

### Vista de reportes (lista)
- Lista cronológica de reportes del proyecto
- Cada item: fecha, quién reportó, clima ícono, personal (cantidad), incidente (sí/no)
- Clic abre detalle completo
- Exportar reporte a PDF

---

## Valorizaciones — Tab dentro del proyecto

BLOQUEANTE: necesita ejemplo real de valorización de Soil Rock antes de implementar.

### Vista de valorizaciones (lista)
- Lista de valorizaciones del proyecto ordenadas por número
- Cada item: número, periodo, estado badge, monto total
- Botón "+ Nueva valorización"

### Detalle de valorización
- Número (correlativo)
- Periodo: fecha inicio — fecha fin
- Estado: en_elaboracion → enviada_cliente → aprobada → facturada
- Tabla de partidas:

| Letra | Descripción | Unidad | Metrado | P.U. | Avance % | Monto |
|-------|------------|--------|---------|------|----------|-------|
| A | Movilización | glb | 1 | 5,000 | 100% | 5,000 |
| B | Calicatas | und | 10 | 350 | 60% | 2,100 |
| C | Ensayos SPT | und | 15 | 250 | 40% | 1,500 |

- Monto total calculado automáticamente
- Avance acumulado (sumando valorizaciones anteriores)
- Botón "Enviar a cliente" → cambia estado + registra actividad
- Botón "Generar factura" (solo si aprobada)
- Exportar a PDF

---

## Facturación — Tab dentro del proyecto

### Vista de facturas (lista)
- Lista de facturas del proyecto
- Cada item: número, valorización vinculada, monto, fecha emisión, fecha vencimiento, estado badge

### Detalle de factura
- Número de factura
- Valorización vinculada
- Monto
- Fecha de emisión
- Fecha de vencimiento
- Estado: emitida → cobrada → vencida → anulada
- Retención de garantía (% y monto)
- Monto neto (monto - retención)
- Método de pago
- Botón "Registrar cobro"

### Alertas
- Facturas por vencer (7 días antes) — badge amarillo
- Facturas vencidas — badge rojo
- Visible en dashboard y en notificaciones

---

## Garantías — Sección dentro de facturación o tab propio

- Tipo: fiel cumplimiento, garantía técnica, retención contractual
- Monto y porcentaje
- Fecha de vencimiento
- Estado: retenida → en gestión → recuperada
- Alerta 30 días antes del vencimiento
- Documento asociado (carta fianza, póliza)

---

## Dashboard — /dashboard

### KPIs (cards superiores)
- Oportunidades activas en pipeline
- Proyectos en ejecución
- Valor total del pipeline
- Cuentas por cobrar (facturas pendientes)

### Secciones
- Pipeline por fase (resumen visual)
- Proyectos activos con avance
- Tareas vencidas o próximas a vencer
- Actividad reciente (últimas acciones)
- Alertas: facturas por vencer, garantías por vencer

---

## Usuarios — /dashboard/usuarios (solo gerente)

- Lista de usuarios con nombre, correo, rol, activo/inactivo
- Crear usuario con rol y contraseña inicial
- Panel de permisos por switches (activar/desactivar cada permiso)
- Desactivar usuario (no eliminar — mantener historial)

---

## Auditoría

- Registro automático de acciones críticas
- Usuario, acción, tabla, registro, fecha, IP
- Solo visible para gerente
- Exportar a Excel

---

## Notificaciones (futuro)

- Campana en sidebar con badge
- Tarea asignada / próxima a vencer
- Factura por vencer / vencida
- Garantía por vencer
- Documento con observaciones
- Configurable por usuario

---

## Reglas de seguridad

1. Login obligatorio — ninguna ruta sin autenticación
2. Contraseñas con hash bcrypt
3. Variables sensibles en .env
4. Consultas solo vía Prisma (nunca SQL concatenado)
5. HTTPS en producción
6. Confirmación antes de eliminar
7. Validación en todos los formularios
8. Límite 50MB en archivos
9. Auditoría de acciones críticas

---

## Terminología de Soil Rock

- Valorización — documento legal de avance
- Expediente técnico — documento principal
- Partida — ítem dentro de una valorización (por letras A, B, C)
- Orden de servicio — documento del cliente al adjudicar
- Ing. Residente — ingeniero a cargo
- Oficina técnica — área que supervisa avance
- Garantía retenida — porcentaje retenido hasta cierre

---

## Schema de base de datos

### Tablas implementadas
- usuarios, clientes, contactos_cliente, proyectos, documentos, actividades

### Tablas pendientes
- tareas (título, descripcion, proyecto_id, asignado_a, creado_por, fecha_limite, estado, prioridad, seccion, created_at)
- subtareas (tarea_id, titulo, completada)
- comentarios_tarea (tarea_id, usuario_id, contenido, created_at)
- proyecto_ingenieros (proyecto_id, usuario_id, rol)
- reportes_campo
- personal_campo_reporte
- valorizaciones
- partidas_valorizacion
- facturas
- garantias
- auditoria_logs

### Código de proyecto: GEO-YYYY-NNN (correlativo global)

---

## Estado actual

### Implementado ✓
- Login + JWT + cookie httpOnly
- Pipeline kanban con 4 columnas + en pausa + perdidas
- Vista unificada (Pipeline + Proyectos comparten componente)
- Clientes con contactos
- Documentos con Supabase Storage (del cliente + nuestros)
- Actividad/timeline
- Dashboard con KPIs
- Sidebar con navegación
- Transiciones de fase con motivo

### Pendiente priorizado
1. Tareas (estilo Asana) + "Mis tareas"
2. Valorizaciones (necesita ejemplo de Anthony)
3. Reportes de campo
4. Facturación + garantías
5. Usuarios + permisos
6. Fix proxy.ts → middleware.ts (para producción)

---

## Información del consultor

- Desarrollador: Gonzalo Mendoza Yrupailla
- Proyecto: Sistema de Gestión Soil Rock
- Inicio: Julio 2026
