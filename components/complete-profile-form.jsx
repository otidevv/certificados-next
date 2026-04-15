"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { User, Loader2, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CompleteProfileForm({ user, redirectUrl }) {
  const router = useRouter()
  const [documentType, setDocumentType] = useState(user?.documentType || "")
  const [documentNumber, setDocumentNumber] = useState(user?.documentNumber || "")
  const [firstName, setFirstName] = useState(user?.firstName || "")
  const [paternalSurname, setPaternalSurname] = useState(user?.paternalSurname || "")
  const [maternalSurname, setMaternalSurname] = useState(user?.maternalSurname || "")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)

  // Auto-lookup DNI
  const lookupDni = useCallback(async (dni) => {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) return
    setIsLookingUp(true)
    try {
      const res = await fetch(`https://apidatos.unamad.edu.pe/api/consulta/${dni}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      if (data.NOMBRES) {
        setFirstName(data.NOMBRES)
        setPaternalSurname(data.AP_PAT)
        setMaternalSurname(data.AP_MAT)
        setLookupDone(true)
      }
    } catch {
      // User fills manually
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!documentType || !documentNumber || !firstName || !paternalSurname || !maternalSurname) {
      setError("Todos los campos son requeridos")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, documentNumber, firstName, paternalSurname, maternalSurname }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error)
      else router.push(redirectUrl)
    } catch {
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-unamad/10 mb-3">
            <User className="h-7 w-7 text-unamad" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Completar perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">Necesitamos estos datos para inscribirte en cursos</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Tipo documento</Label>
                  <Select value={documentType} onValueChange={(v) => { setDocumentType(v); setDocumentNumber(""); setFirstName(""); setPaternalSurname(""); setMaternalSurname(""); setLookupDone(false) }}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>N de documento</Label>
                  <div className="relative">
                    <Input
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="12345678"
                      className={documentType === "DNI" ? "pr-8" : ""}
                    />
                    {documentType === "DNI" && isLookingUp && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {documentType === "DNI" && lookupDone && !isLookingUp && (
                      <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombres</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombres completos" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Apellido paterno</Label>
                  <Input value={paternalSurname} onChange={(e) => setPaternalSurname(e.target.value)} placeholder="Apellido paterno" />
                </div>
                <div className="space-y-2">
                  <Label>Apellido materno</Label>
                  <Input value={maternalSurname} onChange={(e) => setMaternalSurname(e.target.value)} placeholder="Apellido materno" />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-unamad hover:bg-unamad-dark">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar y continuar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
