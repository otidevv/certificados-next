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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Search, MoreHorizontal, Pencil, Trash2, X, Network, Plus,
  Loader2, AlertTriangle, CheckCircle, XCircle,
} from "lucide-react"
import { DependenciaDialog } from "./dependencia-dialog"
import { deleteDependenciaAction, toggleDependenciaStatusAction } from "@/app/admin/dependencias/actions"
import { DataTablePagination } from "./data-table-pagination"
import { toast } from "sonner"

const ease = [0.22, 1, 0.36, 1]

export function DependenciasTable({ data, sedes }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNavigating, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDep, setEditDep] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteDep, setDeleteDep] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

  const debounceRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const cur = searchParams.get("search") || ""
      if (searchValue !== cur) updateSearchParams({ search: searchValue || undefined })
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue])

  const updateSearchParams = useCallback((params) => {
    const newP = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) { if (v) newP.set(k, v); else newP.delete(k) }
    if (!("page" in params)) newP.delete("page")
    startTransition(() => { router.push(`/admin/dependencias?${newP.toString()}`) })
  }, [router, searchParams, startTransition])

  const currentSede = searchParams.get("sedeId") || ""

  async function handleDelete() {
    if (!deleteDep) return
    setDeleting(true)
    const result = await deleteDependenciaAction(deleteDep.id)
    if (result.error) toast.error(result.error)
    else { toast.success("Dependencia eliminada"); setDeleteOpen(false) }
    setDeleting(false)
  }

  async function handleToggleStatus(dep) {
    const result = await toggleDependenciaStatusAction(dep.id)
    if (result.error) toast.error(result.error)
    else toast.success(dep.status ? "Dependencia desactivada" : "Dependencia activada")
  }

  return (
    <div className="space-y-4">
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dependencias</h1>
          <p className="text-sm text-muted-foreground">Gestion de dependencias de la universidad ({data.total} registros)</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditDep(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Nueva Dependencia
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o abreviatura..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9 pr-9" />
                {searchValue && (
                  <button type="button" onClick={() => { setSearchValue(""); updateSearchParams({ search: undefined }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={currentSede} onValueChange={(v) => updateSearchParams({ sedeId: v === "all" ? undefined : v })}>
                <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Todas las sedes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
                  <TableHead className="pl-4">Abreviatura</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Sede</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dependencias.length === 0 && !isNavigating ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Network className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground">No se encontraron dependencias</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.dependencias.map((dep) => (
                    <TableRow key={dep.id}>
                      <TableCell className="pl-4">
                        <Badge variant="outline" className="font-mono">{dep.abbreviation}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-xs">{dep.name}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{dep.sede.name}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{dep.email || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${dep.status ? "bg-emerald-500" : "bg-amber-500"}`} />
                          <span className="text-sm">{dep.status ? "Activo" : "Inactivo"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditDep(dep); setDialogOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(dep)}>
                              {dep.status ? <><XCircle className="mr-2 h-4 w-4" />Desactivar</> : <><CheckCircle className="mr-2 h-4 w-4" />Activar</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleteDep(dep); setDeleteOpen(true) }}>
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

      <DependenciaDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditDep(null) }} dependencia={editDep} sedes={sedes} />

      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteDep(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Eliminar dependencia</DialogTitle>
            <DialogDescription className="text-center">
              Eliminar <span className="font-semibold text-foreground">{deleteDep?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
