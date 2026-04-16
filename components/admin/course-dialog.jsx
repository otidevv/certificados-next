"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Loader2, Upload, X, ImageIcon, ChevronsUpDown, Check, Users, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { createCourseAction, updateCourseAction } from "@/app/admin/cursos/actions"
import { TiptapEditor } from "./tiptap-editor"
import { toast } from "sonner"

const TYPES = [
  { value: "CURSO", label: "Curso" },
  { value: "CAPACITACION", label: "Capacitacion" },
  { value: "TALLER", label: "Taller" },
  { value: "SEMINARIO", label: "Seminario" },
  { value: "DIPLOMADO", label: "Diplomado" },
  { value: "CONFERENCIA", label: "Conferencia" },
  { value: "CONGRESO", label: "Congreso" },
  { value: "SIMPOSIO", label: "Simposio" },
]

const MODALITIES = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "SEMIPRESENCIAL", label: "Semipresencial" },
]

const STATUSES = [
  { value: "ABIERTO", label: "Abierto" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
]

function formatDateForInput(date) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

// --- Multi-select user picker ---
function UserMultiSelect({ users, selected, onChange, label, icon: Icon, placeholder }) {
  const [open, setOpen] = useState(false)

  function toggleUser(user) {
    const exists = selected.find((u) => u.id === user.id)
    if (exists) {
      onChange(selected.filter((u) => u.id !== user.id))
    } else {
      onChange([...selected, { id: user.id, name: user.name || user.email }])
    }
  }

  function removeUser(userId) {
    onChange(selected.filter((u) => u.id !== userId))
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </Label>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
              {u.name}
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {selected.length === 0
              ? placeholder
              : `${selected.length} seleccionado${selected.length > 1 ? "s" : ""}`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar usuario..." />
            <CommandList>
              <CommandEmpty>No se encontró usuario.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => {
                  const isSelected = selected.some((u) => u.id === user.id)
                  return (
                    <CommandItem
                      key={user.id}
                      value={`${user.name} ${user.email}`}
                      onSelect={() => toggleUser(user)}
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm">{user.name || "Sin nombre"}</span>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function CourseDialog({ open, onOpenChange, course, dependencias = [], users = [] }) {
  const isEditing = !!course
  const action = isEditing ? updateCourseAction : createCourseAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)
  const [imageUrl, setImageUrl] = useState(course?.imageUrl || "")
  const [contentHtml, setContentHtml] = useState(course?.content || "")
  const [uploading, setUploading] = useState(false)
  const [depId, setDepId] = useState(course?.dependenciaId || "")
  const [depOpen, setDepOpen] = useState(false)
  const [ponentes, setPonentes] = useState(() => {
    if (course?.ponentes && Array.isArray(course.ponentes)) return course.ponentes
    // Backward compat: if only instructor string exists, don't auto-select
    return []
  })
  const [organizadores, setOrganizadores] = useState(() => {
    if (course?.organizadores && Array.isArray(course.organizadores)) return course.organizadores
    return []
  })

  useEffect(() => {
    setImageUrl(course?.imageUrl || "")
    setContentHtml(course?.content || "")
    setDepId(course?.dependenciaId || "")
    setPonentes(course?.ponentes && Array.isArray(course.ponentes) ? course.ponentes : [])
    setOrganizadores(course?.organizadores && Array.isArray(course.organizadores) ? course.organizadores : [])
  }, [course])

  useEffect(() => {
    if (open && !course) {
      setImageUrl(""); setContentHtml(""); setDepId("")
      setPonentes([]); setOrganizadores([])
    }
  }, [open, course])

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Curso actualizado" : "Curso creado")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, isEditing, onOpenChange])

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) {
        setImageUrl(data.url)
        toast.success("Imagen subida")
      } else {
        toast.error(data.error || "Error al subir imagen")
      }
    } catch {
      toast.error("Error al subir imagen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica la informacion del curso." : "Completa los datos para crear un nuevo curso."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="courseId" value={course.id} />}
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="ponentes" value={JSON.stringify(ponentes)} />
          <input type="hidden" name="organizadores" value={JSON.stringify(organizadores)} />

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>
          )}

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Imagen de portada</Label>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imageUrl} alt="Portada" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click para subir imagen</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={course?.type || ""}>
              <SelectTrigger id="type" aria-invalid={!!state?.fieldErrors?.type}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.type && <p className="text-xs text-destructive">{state.fieldErrors.type}</p>}
          </div>

          {/* Nombre - textarea */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <textarea
              id="name" name="name" defaultValue={course?.name || ""}
              placeholder="Nombre completo del curso, capacitación o taller..."
              rows={2}
              aria-invalid={!!state?.fieldErrors?.name}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
          </div>

          {/* Descripcion */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <textarea
              id="description" name="description" defaultValue={course?.description || ""}
              placeholder="Descripcion breve del curso..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Contenido/temario con Tiptap */}
          <div className="space-y-2">
            <Label>Contenido / Temario</Label>
            <TiptapEditor content={contentHtml} onChange={setContentHtml} name="content" />
          </div>

          {/* Ponentes (multi-select) */}
          <UserMultiSelect
            users={users}
            selected={ponentes}
            onChange={setPonentes}
            label="Ponentes"
            icon={UserCheck}
            placeholder="Seleccionar ponentes..."
          />
          {state?.fieldErrors?.ponentes && <p className="text-xs text-destructive">{state.fieldErrors.ponentes}</p>}

          {/* Organizadores (multi-select) */}
          <UserMultiSelect
            users={users}
            selected={organizadores}
            onChange={setOrganizadores}
            label="Organizadores"
            icon={Users}
            placeholder="Seleccionar organizadores..."
          />

          {/* Horas */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours">Horas</Label>
              <Input id="hours" name="hours" type="number" min="1" defaultValue={course?.hours || ""} placeholder="40" aria-invalid={!!state?.fieldErrors?.hours} />
              {state?.fieldErrors?.hours && <p className="text-xs text-destructive">{state.fieldErrors.hours}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="spots">Vacantes (opcional)</Label>
              <Input id="spots" name="spots" type="number" min="1" defaultValue={course?.spots || ""} placeholder="Sin limite" />
            </div>
          </div>

          {/* Modalidad */}
          <div className="space-y-2">
            <Label htmlFor="modality">Modalidad</Label>
            <Select name="modality" defaultValue={course?.modality || ""}>
              <SelectTrigger id="modality" aria-invalid={!!state?.fieldErrors?.modality}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {MODALITIES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.modality && <p className="text-xs text-destructive">{state.fieldErrors.modality}</p>}
          </div>

          {/* Dependencia (opcional) */}
          {dependencias.length > 0 && (
            <div className="space-y-2">
              <Label>Dependencia (opcional)</Label>
              <input type="hidden" name="dependenciaId" value={depId || "none"} />
              <Popover open={depOpen} onOpenChange={setDepOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={depOpen} className="w-full justify-between font-normal">
                    {depId
                      ? (() => { const d = dependencias.find((d) => d.id === depId); return d ? `${d.abbreviation} - ${d.name}` : "Sin dependencia" })()
                      : "Sin dependencia"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar dependencia..." />
                    <CommandList>
                      <CommandEmpty>No se encontro.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="sin-dependencia" onSelect={() => { setDepId(""); setDepOpen(false) }}>
                          <Check className={cn("mr-2 h-4 w-4", !depId ? "opacity-100" : "opacity-0")} />
                          Sin dependencia
                        </CommandItem>
                        {dependencias.map((dep) => (
                          <CommandItem
                            key={dep.id}
                            value={`${dep.abbreviation} ${dep.name} ${dep.sede.name}`}
                            onSelect={() => { setDepId(dep.id); setDepOpen(false) }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", depId === dep.id ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{dep.abbreviation} - {dep.name} <span className="text-muted-foreground">({dep.sede.name})</span></span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={formatDateForInput(course?.startDate)} aria-invalid={!!state?.fieldErrors?.startDate} />
              {state?.fieldErrors?.startDate && <p className="text-xs text-destructive">{state.fieldErrors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={formatDateForInput(course?.endDate)} aria-invalid={!!state?.fieldErrors?.endDate} />
              {state?.fieldErrors?.endDate && <p className="text-xs text-destructive">{state.fieldErrors.endDate}</p>}
            </div>
          </div>

          {/* Estado (solo en edicion) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue={course?.status || "ABIERTO"}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || uploading} className="cursor-pointer">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear curso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
