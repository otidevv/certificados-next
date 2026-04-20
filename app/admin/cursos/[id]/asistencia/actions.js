"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado" }
  }
  return { session, error: null }
}

export async function toggleAttendance(courseId, enrollmentId, attended) {
  const { error } = await requireAdmin()
  if (error) return { error }

  if (!courseId || !enrollmentId) return { error: "Parámetros inválidos" }

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { attended: Boolean(attended) },
    })
    revalidatePath(`/admin/cursos/${courseId}/asistencia`)
    return { ok: true }
  } catch (e) {
    console.error("toggleAttendance error:", e)
    return { error: "No se pudo actualizar la asistencia" }
  }
}

export async function bulkMarkAttendance(courseId, attended) {
  const { error } = await requireAdmin()
  if (error) return { error }

  if (!courseId) return { error: "Parámetros inválidos" }

  try {
    const result = await prisma.enrollment.updateMany({
      where: { courseId },
      data: { attended: Boolean(attended) },
    })
    revalidatePath(`/admin/cursos/${courseId}/asistencia`)
    return { ok: true, count: result.count }
  } catch (e) {
    console.error("bulkMarkAttendance error:", e)
    return { error: "No se pudo actualizar la asistencia en masa" }
  }
}
