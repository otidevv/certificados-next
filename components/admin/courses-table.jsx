"use client"

import { useState, useCallback, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Search, MoreHorizontal, Pencil, Trash2, X, GraduationCap, Plus,
  Loader2, ArrowUp, ArrowDown, ArrowUpDown, Users, BookOpen, Clock,
} from "lucide-react"
import Link from "next/link"
import { CourseDialog } from "./course-dialog"
import { CourseDeleteDialog } from "./course-delete-dialog"
import { DataTablePagination } from "./data-table-pagination"
import { toast } from "sonner"

const ease = [0.22, 1, 0.36, 1]

const TYPE_LABELS = {
  CURSO: "Curso", CAPACITACION: "Capacitacion", TALLER: "Taller",
  SEMINARIO: "Seminario", DIPLOMADO: "Diplomado",
  CONFERENCIA: "Conferencia", CONGRESO: "Congreso", SIMPOSIO: "Simposio",
}

const STATUS_LABELS = {
  ABIERTO: "Abierto", CERRADO: "Cerrado", EN_CURSO: "En curso", FINALIZADO: "Finalizado",
}

const MODALITY_LABELS = {
  PRESENCIAL: "Presencial", VIRTUAL: "Virtual", SEMIPRESENCIAL: "Semipresencial",
}

function statusVariant(status) {
  if (status === "ABIERTO") return "default"
  if (status === "EN_CURSO") return "secondary"
  if (status === "FINALIZADO") return "outline"
  return "destructive"
}

function typeVariant(type) {
  if (type === "DIPLOMADO") return "default"
  if (type === "CURSO") return "secondary"
  return "outline"
}

function formatDate(date) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

function SortableHeader({ label, field, currentField, currentOrder, onSort, className }) {
  const isActive = currentField === field
  return (
    <TableHead className={className}>
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-muted">
        {label}
        {isActive ? (
          currentOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-foreground" /> : <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover/table:opacity-50" />
        )}
      </button>
    </TableHead>
  )
}

export function CoursesTable({ data, dependencias = [], users = [] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNavigating, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteCourse, setDeleteCourse] = useState(null)
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

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
    startTransition(() => { router.push(`/admin/cursos?${newParams.toString()}`) })
  }, [router, searchParams, startTransition])

  const currentStatus = searchParams.get("status") || ""
  const currentType = searchParams.get("type") || ""
  const currentSearch = searchParams.get("search")
  const currentSortBy = searchParams.get("sortBy") || "createdAt"
  const currentSortOrder = searchParams.get("sortOrder") || "desc"

  function handleSort(field) {
    if (field === currentSortBy) {
      updateSearchParams({ sortBy: field, sortOrder: currentSortOrder === "asc" ? "desc" : "asc" })
    } else {
      updateSearchParams({ sortBy: field, sortOrder: field === "createdAt" || field === "startDate" ? "desc" : "asc" })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestión de cursos, capacitaciones y talleres</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditCourse(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Nuevo Curso
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "Total cursos", value: data.total, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "Abiertos", value: data.openCount, icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Inscritos", value: data.totalEnrollments, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o instructor..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9 pr-9" />
                {searchValue && (
                  <button type="button" onClick={() => { setSearchValue(""); updateSearchParams({ search: undefined }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Select value={currentType} onValueChange={(v) => updateSearchParams({ type: v === "all" ? undefined : v })}>
                  <SelectTrigger className="sm:w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={currentStatus} onValueChange={(v) => updateSearchParams({ status: v === "all" ? undefined : v })}>
                  <SelectTrigger className="sm:w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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

            <Table className="group/table">
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Curso" field="name" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} className="pl-2 sm:pl-4" />
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Instructor</TableHead>
                  <TableHead className="hidden lg:table-cell">Horas</TableHead>
                  <SortableHeader label="Inicio" field="startDate" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} className="hidden sm:table-cell" />
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Inscritos</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.length === 0 && !isNavigating ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <GraduationCap className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <p className="font-medium text-muted-foreground">No se encontraron cursos</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.courses.map((course) => (
                    <TableRow key={course.id} className="group transition-colors">
                      <TableCell className="pl-2 sm:pl-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{course.name}</p>
                          <p className="truncate text-xs text-muted-foreground sm:hidden">
                            {TYPE_LABELS[course.type]} · {course.instructor}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={typeVariant(course.type)}>{TYPE_LABELS[course.type]}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{course.instructor}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />{course.hours}h
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{formatDate(course.startDate)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(course.status)}>{STATUS_LABELS[course.status]}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {course._count.enrollments}{course.spots ? `/${course.spots}` : ""}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/cursos/${course.id}/inscritos`}>
                                <Users className="mr-2 h-4 w-4" />Ver inscritos ({course._count.enrollments})
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditCourse(course); setDialogOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleteCourse(course); setDeleteDialogOpen(true) }}>
                              <Trash2 className="mr-2 h-4 w-4" />Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <CourseDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditCourse(null) }} course={editCourse} dependencias={dependencias} users={users} />
      <CourseDeleteDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteCourse(null) }} course={deleteCourse} />
    </div>
  )
}
