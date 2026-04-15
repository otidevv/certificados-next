"use client"

import { useActionState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { changePasswordAction } from "@/app/admin/actions"
import { toast } from "sonner"

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success("Contraseña actualizada")
      formRef.current?.reset()
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar Contraseña</CardTitle>
        <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4 max-w-md">
          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Tu contraseña actual"
              aria-invalid={!!state?.fieldErrors?.currentPassword}
            />
            {state?.fieldErrors?.currentPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              aria-invalid={!!state?.fieldErrors?.newPassword}
            />
            {state?.fieldErrors?.newPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repetir nueva contraseña"
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
