"use client"

import { useState, useCallback, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Search, X, Users, ArrowLeft, Loader2, Mail, Phone, FileText, Download,
} from "lucide-react"
import * as XLSX from "xlsx"
import { DataTablePagination } from "./data-table-pagination"

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
  return new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

function formatDateTime(date) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export function CourseEnrollmentsTable({ course, data }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNavigating, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

  function exportToExcel() {
    const rows = []
    let seq = 1

    // Ponentes
    const ponentes = Array.isArray(course.ponentes) ? course.ponentes : []
    for (const p of ponentes) {
      rows.push({
        numero_secuencial: seq++,
        numero_documento: p.documentNumber || "",
        nombre_completo: p.name || "",
        cargo: "PONENTE",
      })
    }

    // Organizadores
    const organizadores = Array.isArray(course.organizadores) ? course.organizadores : []
    for (const o of organizadores) {
      rows.push({
        numero_secuencial: seq++,
        numero_documento: o.documentNumber || "",
        nombre_completo: o.name || "",
        cargo: "ORGANIZADOR",
      })
    }

    // Participantes (all enrollments)
    for (const e of data.allEnrollments) {
      rows.push({
        numero_secuencial: seq++,
        numero_documento: e.documentNumber,
        nombre_completo: `${e.firstName} ${e.paternalSurname} ${e.maternalSurname}`,
        cargo: "PARTICIPANTE",
      })
    }

    const ws = XLSX.utils.json_to_sheet(rows)

    // Column widths
    ws["!cols"] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 40 },
      { wch: 16 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Inscritos")

    // Write with UTF-8 BOM for ñ support
    XLSX.writeFile(wb, `inscritos_${course.name.slice(0, 40).replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "").replace(/\s+/g, "_")}.xlsx`, { bookType: "xlsx" })
  }

  const debounceRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const currentSearch = searchParams.get("search") || ""
      if (searchValue !== currentSearch) updateSearchParams({ search: searchValue || undefined })
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue])

  const updateSearchParams = useCallback((params) => {
    const newParams = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(params)) {
      if (value) newParams.set(key, value)
      else newParams.delete(key)
    }
    if (!("page" in params)) newParams.delete("page")
    startTransition(() => {
      router.push(`/admin/cursos/${course.id}/inscritos?${newParams.toString()}`)
    })
  }, [router, searchParams, startTransition, course.id])

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div className="flex flex-col gap-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
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
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{course.name}</h1>
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
          { label: "Total inscritos", value: data.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "Cupos disponibles", value: course.spots ? Math.max(0, course.spots - data.total) : "Ilimitado", icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
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
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => { setSearchValue(""); updateSearchParams({ search: undefined }) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="relative p-0">
            <AnimatePresence>
              {isNavigating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm border">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Cargando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-2 sm:pl-4">Nombre completo</TableHead>
                  <TableHead className="hidden sm:table-cell">Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                  <TableHead>Fecha inscripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.enrollments.length === 0 && !isNavigating ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Users className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <p className="font-medium text-muted-foreground">
                          {searchValue ? "No se encontraron inscritos" : "Aún no hay inscritos en este curso"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="group transition-colors">
                      <TableCell className="pl-2 sm:pl-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {enrollment.paternalSurname} {enrollment.maternalSurname}, {enrollment.firstName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground sm:hidden">
                            {enrollment.documentType}: {enrollment.documentNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{enrollment.documentType}: {enrollment.documentNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{enrollment.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {enrollment.phone ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{enrollment.phone}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{formatDateTime(enrollment.enrolledAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {data.total > 0 && (
              <DataTablePagination
                page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize}
                onPageChange={(p) => updateSearchParams({ page: String(p) })}
                onPageSizeChange={(size) => updateSearchParams({ pageSize: String(size), page: "1" })}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
