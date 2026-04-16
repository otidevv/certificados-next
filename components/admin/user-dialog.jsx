"use client"

import { useActionState, useEffect, useRef, useState, useCallback } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"
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

  const [documentType, setDocumentType] = useState(user?.documentType || "DNI")
  const [documentNumber, setDocumentNumber] = useState(user?.documentNumber || "")
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [paternalSurname, setPaternalSurname] = useState(user?.paternalSurname || "")
  const [maternalSurname, setMaternalSurname] = useState(user?.maternalSurname || "")
  const [email, setEmail] = useState(user?.email || "")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)

  // Auto-lookup DNI
  const lookupDni = useCallback(async (dni) => {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) return
    setIsLookingUp(true)
    try {
      const res = await fetch(`/api/consulta-dni?dni=${dni}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      if (data.firstName) {
        setFirstName(data.firstName)
        setPaternalSurname(data.paternalSurname)
        setMaternalSurname(data.maternalSurname)
        setLookupDone(true)
      }
    } catch {
      // Silently fail
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  useEffect(() => {
    if (documentType !== "DNI" || documentNumber.length !== 8) {
      setLookupDone(false)
      return
    }
    const timer = setTimeout(() => lookupDni(documentNumber), 400)
    return () => clearTimeout(timer)
  }, [documentNumber, documentType, lookupDni])

  useEffect(() => {
    setDocumentType(user?.documentType || "DNI")
    setDocumentNumber(user?.documentNumber || "")
    setFirstName(user?.firstName || "")
    setPaternalSurname(user?.paternalSurname || "")
    setMaternalSurname(user?.maternalSurname || "")
    setEmail(user?.email || "")
    setLookupDone(false)
  }, [user])

  useEffect(() => {
    if (open && !user) {
      setDocumentType("DNI")
      setDocumentNumber("")
      setFirstName("")
      setPaternalSurname("")
      setMaternalSurname("")
      setEmail("")
      setLookupDone(false)
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
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica la información del usuario." : "Completa los datos para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="userId" value={user.id} />}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>
          )}

          {/* Tipo y numero de documento */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Tipo documento</Label>
              <Select name="documentType" value={documentType} onValueChange={(v) => { setDocumentType(v); setDocumentNumber(""); setLookupDone(false) }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="documentNumber">N° de documento</Label>
              <div className="relative">
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder={documentType === "DNI" ? "12345678" : "Número"}
                  className={documentType === "DNI" ? "pr-8" : ""}
                  aria-invalid={!!state?.fieldErrors?.documentNumber}
                />
                {documentType === "DNI" && isLookingUp && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {documentType === "DNI" && lookupDone && !isLookingUp && (
                  <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                )}
              </div>
              {state?.fieldErrors?.documentNumber && <p className="text-xs text-destructive">{state.fieldErrors.documentNumber}</p>}
            </div>
          </div>

          {/* Nombres */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombres</Label>
            <Input
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nombres completos"
              aria-invalid={!!state?.fieldErrors?.firstName}
            />
            {state?.fieldErrors?.firstName && <p className="text-xs text-destructive">{state.fieldErrors.firstName}</p>}
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="paternalSurname">Apellido paterno</Label>
              <Input
                id="paternalSurname"
                name="paternalSurname"
                value={paternalSurname}
                onChange={(e) => setPaternalSurname(e.target.value)}
                placeholder="Apellido paterno"
                aria-invalid={!!state?.fieldErrors?.paternalSurname}
              />
              {state?.fieldErrors?.paternalSurname && <p className="text-xs text-destructive">{state.fieldErrors.paternalSurname}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maternalSurname">Apellido materno</Label>
              <Input
                id="maternalSurname"
                name="maternalSurname"
                value={maternalSurname}
                onChange={(e) => setMaternalSurname(e.target.value)}
                placeholder="Apellido materno"
                aria-invalid={!!state?.fieldErrors?.maternalSurname}
              />
              {state?.fieldErrors?.maternalSurname && <p className="text-xs text-destructive">{state.fieldErrors.maternalSurname}</p>}
            </div>
          </div>

          {/* Email */}
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
            {state?.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email}</p>}
          </div>

          {/* Contraseña (solo al crear) */}
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
              {state?.fieldErrors?.password && <p className="text-xs text-destructive">{state.fieldErrors.password}</p>}
            </div>
          )}

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue={user?.role || "user"}>
              <SelectTrigger id="role" aria-invalid={!!state?.fieldErrors?.role}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.role && <p className="text-xs text-destructive">{state.fieldErrors.role}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="cursor-pointer">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
