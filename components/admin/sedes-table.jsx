"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { MapPin, Plus, MoreHorizontal, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { SedeDialog } from "./sede-dialog"
import { deleteSedeAction } from "@/app/admin/sedes/actions"
import { toast } from "sonner"

const ease = [0.22, 1, 0.36, 1]

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

export function SedesTable({ sedes }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSede, setEditSede] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteSede, setDeleteSede] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteSede) return
    setDeleting(true)
    const result = await deleteSedeAction(deleteSede.id)
    if (result.error) toast.error(result.error)
    else { toast.success("Sede eliminada"); setDeleteOpen(false) }
    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Sedes</h1>
          <p className="text-sm text-muted-foreground">Gestion de sedes de la universidad</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditSede(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Nueva Sede
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nombre</TableHead>
                  <TableHead>Dependencias</TableHead>
                  <TableHead className="hidden sm:table-cell">Creado</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sedes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground">No hay sedes registradas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sedes.map((sede) => (
                    <TableRow key={sede.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <p className="font-medium">{sede.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{sede._count.dependencias} dependencias</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{formatDate(sede.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditSede(sede); setDialogOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setDeleteSede(sede); setDeleteOpen(true) }}>
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
          </CardContent>
        </Card>
      </motion.div>

      <SedeDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditSede(null) }} sede={editSede} />

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteSede(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Eliminar sede</DialogTitle>
            <DialogDescription className="text-center">
              Eliminar <span className="font-semibold text-foreground">{deleteSede?.name}</span>? Esta accion no se puede deshacer.
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
