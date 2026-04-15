"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { updateProfileAction } from "@/app/admin/actions"
import { toast } from "sonner"

export function ProfileForm({ user }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null)
  const lastHandled = useRef(state)

  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success("Perfil actualizado")
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Perfil</CardTitle>
        <CardDescription>Actualiza tu nombre y email</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4 max-w-md">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
