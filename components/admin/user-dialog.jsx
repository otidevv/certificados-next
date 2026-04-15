"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createUserAction, updateUserAction } from "@/app/admin/actions"
import { toast } from "sonner"

const ROLES = [
  { value: "user", label: "Usuario" },
  { value: "admin", label: "Administrador" },
  { value: "superadmin", label: "Super Administrador" },
]

export function UserDialog({ open, onOpenChange, user }) {
  const isEditing = !!user
  const action = isEditing ? updateUserAction : createUserAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)

  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")

  useEffect(() => {
    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
  }, [user])

  useEffect(() => {
    if (open && !user) {
      setName("")
      setEmail("")
    }
  }, [open, user])

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Usuario actualizado" : "Usuario creado")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, isEditing, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del usuario."
              : "Completa los datos para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="userId" value={user.id} />}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.name}
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                aria-invalid={!!state?.fieldErrors?.password}
              />
              {state?.fieldErrors?.password && (
                <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue={user?.role || "user"}>
              <SelectTrigger id="role" aria-invalid={!!state?.fieldErrors?.role}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.role && (
              <p className="text-xs text-destructive">{state.fieldErrors.role}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
