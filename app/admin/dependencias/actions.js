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

export async function createDependenciaAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const sedeId = formData.get("sedeId")
  const abbreviation = formData.get("abbreviation")?.trim()
  const name = formData.get("name")?.trim()
  const email = formData.get("email")?.trim() || null

  const fieldErrors = {}
  if (!sedeId) fieldErrors.sedeId = "Sede es requerida"
  if (!abbreviation) fieldErrors.abbreviation = "Abreviatura es requerida"
  if (!name) fieldErrors.name = "Nombre es requerido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  await prisma.dependencia.create({ data: { sedeId, abbreviation, name, email } })

  revalidatePath("/admin/dependencias")
  return { success: true }
}

export async function updateDependenciaAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const depId = formData.get("depId")
  const sedeId = formData.get("sedeId")
  const abbreviation = formData.get("abbreviation")?.trim()
  const name = formData.get("name")?.trim()
  const email = formData.get("email")?.trim() || null

  if (!depId) return { error: "ID requerido" }

  const fieldErrors = {}
  if (!sedeId) fieldErrors.sedeId = "Sede es requerida"
  if (!abbreviation) fieldErrors.abbreviation = "Abreviatura es requerida"
  if (!name) fieldErrors.name = "Nombre es requerido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  await prisma.dependencia.update({ where: { id: depId }, data: { sedeId, abbreviation, name, email } })

  revalidatePath("/admin/dependencias")
  return { success: true }
}

export async function deleteDependenciaAction(depId) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const dep = await prisma.dependencia.findUnique({
    where: { id: depId },
    include: { _count: { select: { courses: true } } },
  })
  if (!dep) return { error: "Dependencia no encontrada" }
  if (dep._count.courses > 0) return { error: "No se puede eliminar, tiene cursos asociados" }

  await prisma.dependencia.delete({ where: { id: depId } })

  revalidatePath("/admin/dependencias")
  return { success: true }
}

export async function toggleDependenciaStatusAction(depId) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const dep = await prisma.dependencia.findUnique({ where: { id: depId } })
  if (!dep) return { error: "Dependencia no encontrada" }

  await prisma.dependencia.update({ where: { id: depId }, data: { status: !dep.status } })

  revalidatePath("/admin/dependencias")
  return { success: true }
}
