# Diseño: Tomar asistencia de inscritos en cursos

**Fecha:** 2026-04-20
**Autor:** Alberto Peña (apenam@unamad.edu.pe)

## Objetivo

Permitir que usuarios con rol `admin` o `superadmin` marquen la asistencia de los inscritos en un curso. Modelo minimalista: **una sola marca booleana por inscripción** (asistió / no asistió) — sin sesiones por día ni metadatos de auditoría.

## Contexto

- Ruta de ejemplo del usuario: `http://localhost:3000/cursos/cmo0rbc0f0000b0tu3649n45l` (página pública de detalle de curso).
- Ya existe la página admin `/admin/cursos/[id]/inscritos` con tabla, búsqueda, paginación y exportación a Excel de los inscritos.
- `Enrollment` en `prisma/schema.prisma` guarda documento, nombres, email y teléfono pero no tiene campo de asistencia.
- No existe modelo `Attendance` — se evita crearlo por ahora (YAGNI para el caso A).

## Decisiones de alcance

| Decisión | Elegido | Descartado |
|---|---|---|
| Granularidad de la asistencia | Una marca por inscripción (curso completo) | Asistencia por día / por sesión con nombre |
| Ubicación del botón | Página pública `/cursos/[id]` **y** admin `/admin/cursos/[id]/inscritos` | Solo una de las dos |
| Datos guardados | `attended: boolean` únicamente | `markedAt`, `markedBy`, `notes` |
| Modelado | Campo directo en `Enrollment` | Tabla `Attendance` separada |

Si en el futuro se necesita asistencia multi-día, se migrará a un modelo `Attendance` con FK a `Enrollment`. Por ahora no se diseña para ese caso hipotético.

## Cambios de datos

Migración Prisma nueva, agregando un campo al modelo `Enrollment`:

```prisma
model Enrollment {
  // ...campos existentes...
  attended Boolean @default(false)
}
```

Default `false` para que todas las inscripciones existentes queden como "no asistió" hasta que el admin las marque.

## Componentes nuevos / modificados

### A. Página nueva — `app/admin/cursos/[id]/asistencia/page.js`

Server component. Protege por rol: si el usuario no es `admin` ni `superadmin`, `redirect("/admin")`.

Carga:
- El curso (`id`, `name`, `type`, `startDate`, `endDate`, `status`).
- Todos los inscritos del curso ordenados por apellidos, con los campos necesarios para la tabla: `id`, `firstName`, `paternalSurname`, `maternalSurname`, `documentNumber`, `documentType`, `email`, `attended`.
- Contador `presentes` = `enrollments.filter(e => e.attended).length`.

Renderiza `<AttendanceTable course={...} enrollments={...} />`.

Sin paginación server-side — se carga la lista completa para permitir filtrado y marcado rápido en cliente. La cantidad esperada por curso es baja (decenas / bajas centenas).

### B. Cliente nuevo — `components/admin/attendance-table.jsx`

Client component. Estado local:
- `rows` — array de inscritos con `attended` local (optimista).
- `search` — string para filtrar por nombre/apellido/documento.
- `isPending` — `useTransition` para feedback visual durante la server action.

UI:
- Header con nombre del curso, fechas, y contador `X de Y presentes` que se recalcula en vivo.
- Input de búsqueda (filtro cliente, sin reload).
- Botones bulk "Marcar todos presentes" / "Marcar todos ausentes".
- Tabla: N° | Documento | Nombre completo | Email | Checkbox `attended`.
- Botón "Volver" a `/admin/cursos/[id]/inscritos`.

Interacción:
- Toggle individual: actualización optimista del estado local, llama a `toggleAttendance(enrollmentId, nuevoValor)`. Si la server action falla, revertir y mostrar toast de error.
- Bulk: confirmación mínima (`confirm()` nativo basta), llama a `bulkMarkAttendance(courseId, valor)`, actualiza todo el array local.

### C. Server actions — `app/admin/cursos/[id]/asistencia/actions.js`

Ambas hacen `auth()` y validan que `session.user.role` sea `admin` o `superadmin`; si no, `throw new Error("unauthorized")`.

```js
export async function toggleAttendance(courseId, enrollmentId, attended) {
  // auth + role check
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { attended: Boolean(attended) },
  })
  revalidatePath(`/admin/cursos/${courseId}/asistencia`)
}

export async function bulkMarkAttendance(courseId, attended) {
  // auth + role check
  await prisma.enrollment.updateMany({
    where: { courseId },
    data: { attended: Boolean(attended) },
  })
  revalidatePath(`/admin/cursos/${courseId}/asistencia`)
}
```

Ambas reciben `courseId` como primer argumento explícito para mantener las actions puras y permitir la revalidación del path.

### D. Botón en página pública — `components/course-detail.jsx`

La página pública (`app/cursos/[id]/page.js`) ya usa `auth()` — basta con pasar `session` (o solo `session?.user?.role`) como prop adicional a `<CourseDetail>`.

En `CourseDetail`:
- Si `role === "admin"` o `"superadmin"`, se muestra un bloque nuevo en el sidebar (debajo del card de inscripción) con:
  - Título: "Panel de administración"
  - Botón `Link` a `/admin/cursos/${course.id}/asistencia` con icono `ClipboardCheck` o similar de lucide-react y texto "Tomar asistencia".
  - (Opcional) Link secundario "Ver inscritos" a `/admin/cursos/${course.id}/inscritos`.

No se modifica el flujo de inscripción existente.

### E. Botón en tabla admin — `components/admin/course-enrollments-table.jsx`

Agregar un botón "Tomar asistencia" en la barra superior, junto a "Volver" y "Exportar Excel". `Link` a `/admin/cursos/${course.id}/asistencia`.

## Flujos de navegación

1. Admin abre `/cursos/[id]` → ve el nuevo botón "Tomar asistencia" → llega a `/admin/cursos/[id]/asistencia`.
2. Admin abre `/admin/cursos/[id]/inscritos` → click en "Tomar asistencia" → llega a la misma ruta.
3. En la página de asistencia: marca checkboxes (optimista + server action) o usa botones bulk.
4. Botón "Volver" regresa a `/admin/cursos/[id]/inscritos`.

## Manejo de errores

- Usuario no autenticado o sin rol: `redirect("/admin")` en el page + `throw` en las actions.
- Server action falla: revertir la actualización optimista y mostrar un toast rojo con mensaje genérico.
- Curso no existe: `notFound()` en la page.

## Testing manual (golden path)

1. Login como admin.
2. Ir a `/cursos/{id}` — verificar que aparece el botón admin.
3. Click → aterriza en `/admin/cursos/{id}/asistencia` con lista de inscritos y todos `attended: false`.
4. Toggle checkbox de uno → contador sube a `1 de N presentes`, persiste al refrescar.
5. Click "Marcar todos presentes" → todos quedan marcados, contador `N de N`.
6. Click "Marcar todos ausentes" → todos quedan desmarcados.
7. Buscar por documento/nombre → filtra la tabla en vivo.
8. Login como usuario normal → `/admin/cursos/{id}/asistencia` redirige a `/admin`.

## Fuera de alcance (YAGNI)

- Asistencia por día / sesiones con nombre.
- Auditoría (`markedBy`, `markedAt`).
- Notas por inscripción.
- Exportación a Excel de la lista de asistencia (usa la exportación existente en `/inscritos` si la necesita).
- Certificado automático al marcar asistencia.
