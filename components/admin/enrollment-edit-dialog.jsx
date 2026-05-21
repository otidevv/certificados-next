"use client"

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { updateEnrollmentAction } from "@/app/admin/cursos/[id]/inscritos/actions"

export function EnrollmentEditDialog({ open, onOpenChange, enrollment }) {
  const [state, formAction, isPending] = useActionState(updateEnrollmentAction, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)

  const [documentType, setDocumentType] = useState(enrollment?.documentType || "DNI")
  const [documentNumber, setDocumentNumber] = useState(enrollment?.documentNumber || "")
  const [firstName, setFirstName] = useState(enrollment?.firstName || "")
  const [paternalSurname, setPaternalSurname] = useState(enrollment?.paternalSurname || "")
  const [maternalSurname, setMaternalSurname] = useState(enrollment?.maternalSurname || "")
  const [email, setEmail] = useState(enrollment?.email || "")
  const [phone, setPhone] = useState(enrollment?.phone || "")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [lookupError, setLookupError] = useState("")

  // Reset every time the row being edited changes (or dialog opens)
  useEffect(() => {
    if (!enrollment) return
    setDocumentType(enrollment.documentType || "DNI")
    setDocumentNumber(enrollment.documentNumber || "")
    setFirstName(enrollment.firstName || "")
    setPaternalSurname(enrollment.paternalSurname || "")
    setMaternalSurname(enrollment.maternalSurname || "")
    setEmail(enrollment.email || "")
    setPhone(enrollment.phone || "")
    setLookupDone(false)
    setLookupError("")
  }, [enrollment])

  const lookupDni = useCallback(async (dni, { manual = false } = {}) => {
    if (!/^\d{8}$/.test(dni)) return
    setIsLookingUp(true)
    setLookupError("")
    try {
      const res = await fetch(`/api/consulta-dni?dni=${dni}`)
      if (!res.ok) throw new Error("No encontrado")
      const data = await res.json()
      if (data.firstName) {
        setFirstName(data.firstName)
        setPaternalSurname(data.paternalSurname || "")
        setMaternalSurname(data.maternalSurname || "")
        setLookupDone(true)
      } else if (manual) {
        setLookupError("No se encontraron datos para este DNI")
      }
    } catch {
      if (manual) setLookupError("No se pudo consultar el DNI")
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  // Manual button — admin can re-fetch even if DNI didn't change
  const handleRefetch = () => {
    if (documentType !== "DNI" || !/^\d{8}$/.test(documentNumber)) {
      setLookupError("Ingresa un DNI válido de 8 dígitos")
      return
    }
    setLookupDone(false)
    lookupDni(documentNumber, { manual: true })
  }

  // Show toast + close on success
  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success("Inscripción actualizada")
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Inscripción</DialogTitle>
          <DialogDescription>
            Corrige los datos del inscrito. Para DNI puedes usar el botón de consulta para traer los datos oficiales.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="enrollmentId" value={enrollment?.id || ""} />

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</div>
          )}

          {/* Documento */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Tipo documento</Label>
              <Select
                name="documentType"
                value={documentType}
                onValueChange={(v) => { setDocumentType(v); setLookupDone(false); setLookupError("") }}
              >
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="documentNumber"
                    name="documentNumber"
                    value={documentNumber}
                    onChange={(e) => { setDocumentNumber(e.target.value); setLookupDone(false); setLookupError("") }}
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
                {documentType === "DNI" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRefetch}
                    disabled={isLookingUp}
                    title="Consultar datos por DNI"
                    className="shrink-0 cursor-pointer"
                  >
                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {state?.fieldErrors?.documentNumber && (
                <p className="text-xs text-destructive">{state.fieldErrors.documentNumber}</p>
              )}
              {lookupError && !state?.fieldErrors?.documentNumber && (
                <p className="text-xs text-destructive">{lookupError}</p>
              )}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email}</p>}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="999 999 999"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="cursor-pointer">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
