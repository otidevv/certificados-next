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

export async function createSedeAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const name = formData.get("name")?.trim()
  if (!name) return { fieldErrors: { name: "Nombre es requerido" } }

  const existing = await prisma.sede.findUnique({ where: { name } })
  if (existing) return { fieldErrors: { name: "Ya existe una sede con ese nombre" } }

  await prisma.sede.create({ data: { name } })

  revalidatePath("/admin/sedes")
  return { success: true }
}

export async function updateSedeAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const sedeId = formData.get("sedeId")
  const name = formData.get("name")?.trim()

  if (!sedeId) return { error: "ID requerido" }
  if (!name) return { fieldErrors: { name: "Nombre es requerido" } }

  const existing = await prisma.sede.findFirst({ where: { name, NOT: { id: sedeId } } })
  if (existing) return { fieldErrors: { name: "Ya existe una sede con ese nombre" } }

  await prisma.sede.update({ where: { id: sedeId }, data: { name } })

  revalidatePath("/admin/sedes")
  return { success: true }
}

export async function deleteSedeAction(sedeId) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const sede = await prisma.sede.findUnique({
    where: { id: sedeId },
    include: { _count: { select: { dependencias: true } } },
  })
  if (!sede) return { error: "Sede no encontrada" }
  if (sede._count.dependencias > 0) return { error: "No se puede eliminar, tiene dependencias asociadas" }

  await prisma.sede.delete({ where: { id: sedeId } })

  revalidatePath("/admin/sedes")
  return { success: true }
}
