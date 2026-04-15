"use client"

import { useActionState, useEffect, useRef } from "react"
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
import { Loader2 } from "lucide-react"
import { resetPasswordAction } from "@/app/admin/actions"
import { toast } from "sonner"

export function ResetPasswordDialog({ open, onOpenChange, user }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null)
  const formRef = useRef(null)
  const lastHandled = useRef(state)

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success("Contraseña reseteada")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, onOpenChange])

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resetear contraseña</DialogTitle>
          <DialogDescription>
            Establecer nueva contraseña para{" "}
            <span className="font-semibold text-foreground">{user.name || user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

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
              placeholder="Repetir contraseña"
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resetear contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
