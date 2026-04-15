"use client"

import { useState } from "react"
import { KeyRound, Loader2, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ChangePasswordPublic() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("La nueva contrasena debe tener al menos 6 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error)
      else setSuccess(true)
    } catch {
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Contrasena actualizada</h2>
          <p className="text-gray-500 mb-6">Tu contrasena ha sido cambiada exitosamente.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-unamad text-white px-6 py-3 rounded-lg font-semibold hover:bg-unamad-dark transition-all text-sm">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-unamad/10 mb-3">
            <KeyRound className="h-7 w-7 text-unamad" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cambiar contrasena</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresa tu contrasena actual y la nueva</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contrasena actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Tu contrasena actual"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contrasena</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contrasena</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir nueva contrasena"
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-unamad hover:bg-unamad-dark">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cambiando...</>
                ) : (
                  "Cambiar contrasena"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
