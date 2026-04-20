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
