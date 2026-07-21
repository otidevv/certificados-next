"use server"

import { auth } from "@/lib/auth"
import { saveRegistrosMensuales } from "@/lib/registro-mensual"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado", session: null }
  }
  return { session, error: null }
}

export async function saveRegistrosMensualesAction(payload) {
  const { error } = await requireAdmin()
  if (error) return { error }

  try {
    return await saveRegistrosMensuales(payload)
  } catch (error) {
    // Sin esto el detalle se pierde y el usuario solo ve un mensaje genérico.
    console.error("Error al guardar registros mensuales:", error)
    return { error: "Error al guardar los registros mensuales — revisa la consola del servidor" }
  }
}
