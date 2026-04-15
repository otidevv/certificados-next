"use client"

import { useActionState, useEffect, useRef } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createSedeAction, updateSedeAction } from "@/app/admin/sedes/actions"
import { toast } from "sonner"

export function SedeDialog({ open, onOpenChange, sede }) {
  const isEditing = !!sede
  const action = isEditing ? updateSedeAction : createSedeAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Sede actualizada" : "Sede creada")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, isEditing, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
          <DialogDescription>{isEditing ? "Modifica el nombre de la sede." : "Ingresa el nombre de la nueva sede."}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="sedeId" value={sede.id} />}
          {state?.error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la sede</Label>
            <Input id="name" name="name" defaultValue={sede?.name || ""} placeholder="Ej: Ciudad Universitaria" aria-invalid={!!state?.fieldErrors?.name} />
            {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar" : "Crear sede"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
