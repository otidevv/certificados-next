# Tomar Asistencia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que un admin/superadmin marque asistencia (un booleano por inscrito) en un curso, con entrada desde la página pública del curso y desde la página admin de inscritos.

**Architecture:** Se añade un campo `attended: Boolean` al modelo `Enrollment`. Se crea una nueva página admin `/admin/cursos/[id]/asistencia` con tabla cliente y dos server actions (`toggleAttendance`, `bulkMarkAttendance`). Se agregan botones de entrada en `components/course-detail.jsx` (condicionado por rol) y en `components/admin/course-enrollments-table.jsx`.

**Tech Stack:** Next.js 16 App Router, React 19, NextAuth v5 (JWT), Prisma 7 (Postgres), shadcn/ui + Radix, `motion/react`, `sonner` para toasts, `lucide-react` iconos, Tailwind.

**Spec:** `docs/superpowers/specs/2026-04-20-tomar-asistencia-design.md`

**Notas para el implementador:**
- No hay framework de tests en este repo. La validación de cada tarea es **manual** contra `npm run dev` y `prisma migrate dev`.
- El proyecto usa **JavaScript/JSX** (no TypeScript). El archivo `jsconfig.json` define el alias `@/*` → raíz del proyecto.
- Servidor y cliente: `"use server"` en actions, `"use client"` en componentes con estado/hooks.
- Sonner ya está montado globalmente — basta importar `toast` de `"sonner"`.
- Todas las páginas admin siguen este patrón de guardia:
  ```js
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) redirect("/admin")
  ```

---

## File Structure

**Crear:**
- `prisma/migrations/<timestamp>_add_attended_to_enrollment/migration.sql` (generado por Prisma CLI)
- `app/admin/cursos/[id]/asistencia/page.js` — server component + guardia de rol
- `app/admin/cursos/[id]/asistencia/loading.js` — skeleton de carga
- `app/admin/cursos/[id]/asistencia/actions.js` — server actions `toggleAttendance` y `bulkMarkAttendance`
- `components/admin/attendance-table.jsx` — UI cliente con checkboxes optimistas, búsqueda, bulk

**Modificar:**
- `prisma/schema.prisma` — añadir `attended Boolean @default(false)` a `Enrollment`
- `app/cursos/[id]/page.js` — pasar `session` (o rol) a `<CourseDetail>`
- `components/course-detail.jsx` — aceptar prop `userRole` y renderizar bloque admin en sidebar
- `components/admin/course-enrollments-table.jsx` — añadir botón "Tomar asistencia" en el header

---

## Task 1: Migración de base de datos — campo `attended`

**Files:**
- Modify: `prisma/schema.prisma` (modelo `Enrollment`, después de la línea `phone String?`)
- Create: `prisma/migrations/<timestamp>_add_attended_to_enrollment/migration.sql` (generado automáticamente)

- [ ] **Step 1: Editar `prisma/schema.prisma`**

Abrir `prisma/schema.prisma`, localizar el modelo `Enrollment` y agregar el campo `attended` justo después de `phone`:

```prisma
model Enrollment {
  id              String   @id @default(cuid())
  courseId         String
  course          Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  documentType    String
  documentNumber  String
  firstName       String
  paternalSurname String
  maternalSurname String
  email           String
  phone           String?
  attended        Boolean  @default(false)
  enrolledAt      DateTime @default(now())

  @@unique([courseId, documentNumber])
  @@index([courseId])
}
```

- [ ] **Step 2: Crear y aplicar la migración**

Run: `npx prisma migrate dev --name add_attended_to_enrollment`
Expected: Prisma genera un nuevo directorio en `prisma/migrations/` con el SQL `ALTER TABLE "Enrollment" ADD COLUMN "attended" BOOLEAN NOT NULL DEFAULT false;`, aplica la migración y regenera el cliente. Mensaje final: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verificar que el cliente Prisma conoce el campo**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sin errores. El campo `attended` queda disponible en el tipo `Enrollment` del cliente.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add attended boolean to Enrollment"
```

---

## Task 2: Server actions para asistencia

**Files:**
- Create: `app/admin/cursos/[id]/asistencia/actions.js`

- [ ] **Step 1: Crear el archivo de actions**

Crear `app/admin/cursos/[id]/asistencia/actions.js` con este contenido exacto:

```js
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado" }
  }
  return { session, error: null }
}

export async function toggleAttendance(courseId, enrollmentId, attended) {
  const { error } = await requireAdmin()
  if (error) return { error }

  if (!courseId || !enrollmentId) return { error: "Parámetros inválidos" }

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { attended: Boolean(attended) },
    })
    revalidatePath(`/admin/cursos/${courseId}/asistencia`)
    return { ok: true }
  } catch (e) {
    console.error("toggleAttendance error:", e)
    return { error: "No se pudo actualizar la asistencia" }
  }
}

export async function bulkMarkAttendance(courseId, attended) {
  const { error } = await requireAdmin()
  if (error) return { error }

  if (!courseId) return { error: "Parámetros inválidos" }

  try {
    const result = await prisma.enrollment.updateMany({
      where: { courseId },
      data: { attended: Boolean(attended) },
    })
    revalidatePath(`/admin/cursos/${courseId}/asistencia`)
    return { ok: true, count: result.count }
  } catch (e) {
    console.error("bulkMarkAttendance error:", e)
    return { error: "No se pudo actualizar la asistencia en masa" }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/cursos/[id]/asistencia/actions.js
git commit -m "feat(admin): add server actions for course attendance"
```

---

## Task 3: Página admin de asistencia (server component)

**Files:**
- Create: `app/admin/cursos/[id]/asistencia/page.js`
- Create: `app/admin/cursos/[id]/asistencia/loading.js`

- [ ] **Step 1: Crear `loading.js`**

Crear `app/admin/cursos/[id]/asistencia/loading.js` con este contenido exacto:

```jsx
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-6 w-72 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  )
}
```

- [ ] **Step 2: Crear `page.js`**

Crear `app/admin/cursos/[id]/asistencia/page.js` con este contenido exacto:

```jsx
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { AttendanceTable } from "@/components/admin/attendance-table"

export const dynamic = "force-dynamic"

export default async function CursoAsistenciaPage({ params }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    redirect("/admin")
  }

  const { id } = await params

  const [course, enrollments] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        instructor: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { courseId: id },
      orderBy: [{ paternalSurname: "asc" }, { maternalSurname: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        paternalSurname: true,
        maternalSurname: true,
        documentType: true,
        documentNumber: true,
        email: true,
        attended: true,
      },
    }),
  ])

  if (!course) notFound()

  return <AttendanceTable course={course} enrollments={enrollments} />
}
```

- [ ] **Step 3: Verificar compilación**

Run: `npm run dev` (si no está corriendo)
Abrir en el navegador: `http://localhost:3000/admin/cursos/<id-curso-real>/asistencia` (con sesión admin).
Expected: la página compila sin errores. Puede mostrar error del import `@/components/admin/attendance-table` — **es esperado**, se crea en la Task 4.

- [ ] **Step 4: Commit**

```bash
git add app/admin/cursos/[id]/asistencia/page.js app/admin/cursos/[id]/asistencia/loading.js
git commit -m "feat(admin): add attendance page route and loading skeleton"
```

---

## Task 4: Componente cliente `AttendanceTable`

**Files:**
- Create: `components/admin/attendance-table.jsx`

- [ ] **Step 1: Crear el componente completo**

Crear `components/admin/attendance-table.jsx` con este contenido exacto:

```jsx
"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Search, X, ArrowLeft, ClipboardCheck, Users, CheckCheck, Loader2,
} from "lucide-react"
import { toggleAttendance, bulkMarkAttendance } from "@/app/admin/cursos/[id]/asistencia/actions"

const ease = [0.22, 1, 0.36, 1]

const STATUS_LABELS = {
  ABIERTO: "Abierto", CERRADO: "Cerrado", EN_CURSO: "En curso", FINALIZADO: "Finalizado",
}

const TYPE_LABELS = {
  CURSO: "Curso", CAPACITACION: "Capacitacion", TALLER: "Taller",
  SEMINARIO: "Seminario", DIPLOMADO: "Diplomado",
  CONFERENCIA: "Conferencia", CONGRESO: "Congreso", SIMPOSIO: "Simposio",
}

function statusVariant(status) {
  if (status === "ABIERTO") return "default"
  if (status === "EN_CURSO") return "secondary"
  if (status === "FINALIZADO") return "outline"
  return "destructive"
}

function formatDate(date) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  })
}

export function AttendanceTable({ course, enrollments }) {
  const [rows, setRows] = useState(enrollments)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const fullName = `${r.firstName} ${r.paternalSurname} ${r.maternalSurname}`.toLowerCase()
      return (
        fullName.includes(q) ||
        r.documentNumber.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  const presentCount = rows.filter((r) => r.attended).length
  const totalCount = rows.length

  function handleToggle(enrollmentId, nextValue) {
    const previous = rows
    setRows((prev) => prev.map((r) => (r.id === enrollmentId ? { ...r, attended: nextValue } : r)))
    startTransition(async () => {
      const res = await toggleAttendance(course.id, enrollmentId, nextValue)
      if (res?.error) {
        setRows(previous)
        toast.error(res.error)
      }
    })
  }

  function handleBulk(value) {
    const label = value ? "presentes" : "ausentes"
    if (!confirm(`¿Marcar a todos los inscritos como ${label}?`)) return
    const previous = rows
    setRows((prev) => prev.map((r) => ({ ...r, attended: value })))
    startTransition(async () => {
      const res = await bulkMarkAttendance(course.id, value)
      if (res?.error) {
        setRows(previous)
        toast.error(res.error)
      } else {
        toast.success(`Todos marcados como ${label}`)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/cursos/${course.id}/inscritos`}>
              <ArrowLeft className="mr-2 h-4 w-4" />Volver a inscritos
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulk(false)}
              disabled={isPending || totalCount === 0}
              className="cursor-pointer"
            >
              Marcar todos ausentes
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulk(true)}
              disabled={isPending || totalCount === 0}
              className="cursor-pointer"
            >
              <CheckCheck className="mr-2 h-4 w-4" />Marcar todos presentes
            </Button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Asistencia: {course.name}
            </h1>
            <Badge variant={statusVariant(course.status)}>{STATUS_LABELS[course.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {TYPE_LABELS[course.type]} · {course.instructor} · {formatDate(course.startDate)} — {formatDate(course.endDate)}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[
          { label: "Total inscritos", value: totalCount, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Presentes", value: `${presentCount} / ${totalCount}`, icon: CheckCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease }}>
            <Card className="py-2 sm:py-3">
              <CardContent className="flex items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4">
                <div className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground sm:text-xs">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, documento o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 pl-4">#</TableHead>
                  <TableHead className="hidden sm:table-cell">Documento</TableHead>
                  <TableHead>Nombre completo</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="w-32 text-center">
                    <span className="inline-flex items-center gap-1">
                      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                      Asistió
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Users className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <p className="font-medium text-muted-foreground">
                          {search ? "No se encontraron inscritos" : "Aún no hay inscritos en este curso"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r, idx) => (
                    <TableRow key={r.id} data-attended={r.attended}>
                      <TableCell className="pl-4 text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-xs">
                        {r.documentType} {r.documentNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.paternalSurname} {r.maternalSurname}, {r.firstName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {r.email}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={r.attended}
                          onCheckedChange={(checked) => handleToggle(r.id, Boolean(checked))}
                          disabled={isPending}
                          aria-label={`Marcar asistencia de ${r.firstName} ${r.paternalSurname}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que `Checkbox` existe**

Run: `ls "components/ui/checkbox.jsx"`
Expected: El archivo existe (listado confirma su presencia). Si no existiera, habría que generarlo con `npx shadcn@latest add checkbox` — pero ya está en el proyecto.

- [ ] **Step 3: Verificación manual en navegador**

Con el dev server corriendo, logueado como admin, navegar a `http://localhost:3000/admin/cursos/<id-curso-con-inscritos>/asistencia`.
Expected:
- La página carga mostrando header con nombre del curso, contador `0 / N Presentes`, búsqueda, y tabla con inscritos.
- Al marcar un checkbox, el contador sube en 1, hay un spinner breve en el header, y al refrescar la página el valor persiste.
- Click "Marcar todos presentes" → confirm nativo → todos quedan marcados, contador `N / N`.
- Click "Marcar todos ausentes" → todos se desmarcan.
- Búsqueda por apellido/documento/email filtra la tabla en vivo.
- Botón "Volver a inscritos" lleva a `/admin/cursos/<id>/inscritos`.

- [ ] **Step 4: Verificar protección de rol**

Abrir sesión con un usuario de rol `user` y navegar a la misma URL.
Expected: redirección inmediata a `/admin`.

- [ ] **Step 5: Commit**

```bash
git add components/admin/attendance-table.jsx
git commit -m "feat(admin): add AttendanceTable client with optimistic toggle and bulk actions"
```

---

## Task 5: Botón de entrada en la página pública del curso

**Files:**
- Modify: `app/cursos/[id]/page.js`
- Modify: `components/course-detail.jsx`

- [ ] **Step 1: Pasar el rol al componente `CourseDetail`**

Abrir `app/cursos/[id]/page.js`. Reemplazar el bloque de render por el siguiente (la única diferencia es agregar `userRole={session?.user?.role}` en `<CourseDetail>`):

```jsx
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <CourseDetail course={course} isEnrolled={isEnrolled} userRole={session?.user?.role} />
      </main>
      <PublicFooter />
    </div>
  )
```

- [ ] **Step 2: Importar `ClipboardCheck` en `components/course-detail.jsx`**

Abrir `components/course-detail.jsx`. Localizar el bloque de import de `lucide-react` (alrededor de líneas 9–12) y agregar `ClipboardCheck` al final de la lista:

```jsx
import {
  GraduationCap, Clock, Calendar, User, Users, MapPin,
  Loader2, CheckCircle, ChevronRight, Award, BookOpen, ArrowRight, X,
  ClipboardCheck,
} from "lucide-react"
```

- [ ] **Step 3: Aceptar el prop `userRole` en `CourseDetail`**

En la misma función (línea ~182), cambiar la firma:

```jsx
export function CourseDetail({ course, isEnrolled = false, userRole = null }) {
```

- [ ] **Step 4: Agregar el bloque admin en el sidebar**

En `components/course-detail.jsx`, localizar la sección del sidebar donde termina la "Instructor card" — la `</div>` de cierre del bloque `<div className="bg-gray-50 rounded-xl p-5 border">` (alrededor de línea 402, justo antes del `</div>` que cierra `sticky top-20 space-y-4`).

Insertar justo **después** del cierre de la instructor card y **antes** del cierre del contenedor `sticky top-20 space-y-4`:

```jsx
              {/* Admin actions */}
              {(userRole === "admin" || userRole === "superadmin") && (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium mb-3 uppercase tracking-wide">
                    Panel de administración
                  </p>
                  <div className="space-y-2">
                    <Link
                      href={`/admin/cursos/${course.id}/asistencia`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Tomar asistencia
                    </Link>
                    <Link
                      href={`/admin/cursos/${course.id}/inscritos`}
                      className="w-full inline-flex items-center justify-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      Ver inscritos <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
```

- [ ] **Step 5: Verificación manual**

Con dev server corriendo y sesión admin, ir a `http://localhost:3000/cursos/<id>`.
Expected:
- En el sidebar, debajo del card de instructor, aparece un bloque amarillo "Panel de administración" con dos links.
- Click "Tomar asistencia" → lleva a `/admin/cursos/<id>/asistencia`.
- Click "Ver inscritos" → lleva a `/admin/cursos/<id>/inscritos`.

Con sesión de usuario `user` (o sin sesión), ir a la misma URL.
Expected: el bloque "Panel de administración" NO aparece; el resto de la página funciona igual que antes.

- [ ] **Step 6: Commit**

```bash
git add app/cursos/[id]/page.js components/course-detail.jsx
git commit -m "feat(courses): show admin attendance shortcut on public course page"
```

---

## Task 6: Botón de entrada en la página admin de inscritos

**Files:**
- Modify: `components/admin/course-enrollments-table.jsx`

- [ ] **Step 1: Agregar `ClipboardCheck` al import de `lucide-react`**

Abrir `components/admin/course-enrollments-table.jsx`. Localizar la línea del import de lucide-react (línea ~14-16) y agregar `ClipboardCheck` al final:

```jsx
import {
  Search, X, Users, ArrowLeft, Loader2, Mail, Phone, FileText, Download,
  ClipboardCheck,
} from "lucide-react"
```

- [ ] **Step 2: Agregar el botón junto a "Exportar Excel"**

Localizar el bloque del header (aprox. línea 139-148) que contiene el botón "Volver" y el botón "Exportar Excel":

```jsx
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/cursos">
              <ArrowLeft className="mr-2 h-4 w-4" />Volver
            </Link>
          </Button>
          <Button size="sm" onClick={exportToExcel} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />Exportar Excel
          </Button>
        </div>
```

Reemplazarlo por:

```jsx
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/cursos">
              <ArrowLeft className="mr-2 h-4 w-4" />Volver
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="cursor-pointer">
              <Link href={`/admin/cursos/${course.id}/asistencia`}>
                <ClipboardCheck className="mr-2 h-4 w-4" />Tomar asistencia
              </Link>
            </Button>
            <Button size="sm" onClick={exportToExcel} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />Exportar Excel
            </Button>
          </div>
        </div>
```

- [ ] **Step 3: Verificación manual**

Navegar a `http://localhost:3000/admin/cursos/<id>/inscritos` como admin.
Expected:
- Aparece el nuevo botón "Tomar asistencia" junto a "Exportar Excel".
- Click → lleva a `/admin/cursos/<id>/asistencia`.
- El resto de la tabla (búsqueda, paginación, export) sigue funcionando sin regresiones.

- [ ] **Step 4: Commit**

```bash
git add components/admin/course-enrollments-table.jsx
git commit -m "feat(admin): add Tomar asistencia button in inscritos header"
```

---

## Task 7: Validación end-to-end y limpieza

- [ ] **Step 1: Smoke test del flujo completo (camino feliz)**

Con dev server corriendo:
1. Login como admin.
2. Navegar a `http://localhost:3000/cursos/<id>` — verificar botón amarillo de admin en sidebar.
3. Click "Tomar asistencia" → aterriza en `/admin/cursos/<id>/asistencia`.
4. Marcar 3 checkboxes → contador sube a `3 / N`.
5. Refrescar → persisten marcados.
6. Click "Marcar todos presentes" → confirm → contador `N / N`.
7. Click "Marcar todos ausentes" → confirm → contador `0 / N`.
8. Buscar "garcía" (o apellido real existente) → tabla filtra.
9. Click "Volver a inscritos" → `/admin/cursos/<id>/inscritos`.
10. Desde ahí, click "Tomar asistencia" → regresa a la página de asistencia.

- [ ] **Step 2: Smoke test de rol no admin**

1. Logout y login como usuario con rol `user`.
2. Navegar a `http://localhost:3000/cursos/<id>` — verificar que el panel amarillo NO aparece.
3. Navegar directamente a `http://localhost:3000/admin/cursos/<id>/asistencia` — verificar redirección a `/admin`.

- [ ] **Step 3: Verificar que no quedaron archivos sueltos**

Run: `git status`
Expected: `nothing to commit, working tree clean` (todo ya fue commiteado en las tareas anteriores).

- [ ] **Step 4: Verificar build de producción**

Run: `npm run build`
Expected: build exitoso sin errores de tipo, sin warnings nuevos de rutas, y con la ruta `/admin/cursos/[id]/asistencia` listada en el output de rutas.

- [ ] **Step 5: Commit final (solo si hubo ajustes)**

Si el build requirió algún ajuste, commitear aquí:

```bash
git add -A
git commit -m "chore: minor adjustments after build verification"
```

Si no hubo cambios, saltar este step.

---

## Resumen de cambios al terminar

- 1 migración Prisma (`add_attended_to_enrollment`).
- 1 campo nuevo en `Enrollment`.
- 4 archivos nuevos: page admin, loading, actions, componente cliente.
- 3 archivos modificados: schema, course-detail (público), course-enrollments-table (admin).
- 6 commits (uno por tarea) + 1 commit opcional de ajustes.
