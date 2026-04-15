"use client"

import { useActionState, useEffect, useRef } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createDependenciaAction, updateDependenciaAction } from "@/app/admin/dependencias/actions"
import { toast } from "sonner"

export function DependenciaDialog({ open, onOpenChange, dependencia, sedes }) {
  const isEditing = !!dependencia
  const action = isEditing ? updateDependenciaAction : createDependenciaAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Dependencia actualizada" : "Dependencia creada")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, isEditing, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Dependencia" : "Nueva Dependencia"}</DialogTitle>
          <DialogDescription>{isEditing ? "Modifica los datos de la dependencia." : "Completa los datos de la nueva dependencia."}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="depId" value={dependencia.id} />}
          {state?.error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>}

          <div className="space-y-2">
            <Label htmlFor="sedeId">Sede</Label>
            <Select name="sedeId" defaultValue={dependencia?.sedeId || ""}>
              <SelectTrigger id="sedeId" aria-invalid={!!state?.fieldErrors?.sedeId}>
                <SelectValue placeholder="Seleccionar sede" />
              </SelectTrigger>
              <SelectContent>
                {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.sedeId && <p className="text-xs text-destructive">{state.fieldErrors.sedeId}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abreviatura</Label>
              <Input id="abbreviation" name="abbreviation" defaultValue={dependencia?.abbreviation || ""} placeholder="OTI" aria-invalid={!!state?.fieldErrors?.abbreviation} />
              {state?.fieldErrors?.abbreviation && <p className="text-xs text-destructive">{state.fieldErrors.abbreviation}</p>}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={dependencia?.name || ""} placeholder="Oficina de Tecnologias..." aria-invalid={!!state?.fieldErrors?.name} />
              {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input id="email" name="email" type="email" defaultValue={dependencia?.email || ""} placeholder="dependencia@unamad.edu.pe" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar" : "Crear dependencia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
