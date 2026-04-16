"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const VALID_TYPES = ["CURSO", "CAPACITACION", "TALLER", "SEMINARIO", "DIPLOMADO", "CONFERENCIA", "CONGRESO", "SIMPOSIO"]
const VALID_MODALITIES = ["PRESENCIAL", "VIRTUAL", "SEMIPRESENCIAL"]
const VALID_STATUSES = ["ABIERTO", "CERRADO", "EN_CURSO", "FINALIZADO"]

async function requireAdmin() {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado", session: null }
  }
  return { session, error: null }
}

export async function createCourseAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const name = formData.get("name")?.trim()
  const type = formData.get("type")
  const description = formData.get("description")?.trim() || null
  const content = formData.get("content")?.trim() || null
  const imageUrl = formData.get("imageUrl")?.trim() || null
  const depRaw = formData.get("dependenciaId")
  const dependenciaId = depRaw && depRaw !== "none" ? depRaw : null
  const hours = Number(formData.get("hours"))
  const modality = formData.get("modality")
  const startDate = formData.get("startDate")
  const endDate = formData.get("endDate")
  const spotsRaw = formData.get("spots")?.trim()
  const spots = spotsRaw ? Number(spotsRaw) : null

  let ponentes = []
  try { ponentes = JSON.parse(formData.get("ponentes") || "[]") } catch { ponentes = [] }
  let organizadores = []
  try { organizadores = JSON.parse(formData.get("organizadores") || "[]") } catch { organizadores = [] }

  // Build instructor string from ponentes for backward compat and display
  const instructor = ponentes.map((p) => p.name).join(", ") || ""

  const fieldErrors = {}

  if (!name) fieldErrors.name = "Nombre es requerido"
  if (!type || !VALID_TYPES.includes(type)) fieldErrors.type = "Tipo es requerido"
  if (!hours || hours < 1) fieldErrors.hours = "Horas debe ser al menos 1"
  if (!modality || !VALID_MODALITIES.includes(modality)) fieldErrors.modality = "Modalidad es requerida"
  if (!startDate) fieldErrors.startDate = "Fecha de inicio es requerida"
  if (!endDate) fieldErrors.endDate = "Fecha de fin es requerida"
  if (startDate && endDate && new Date(startDate) > new Date(endDate))
    fieldErrors.endDate = "Fecha de fin debe ser posterior al inicio"
  if (ponentes.length === 0) fieldErrors.ponentes = "Selecciona al menos un ponente"
  if (spots !== null && spots < 1) fieldErrors.spots = "Vacantes debe ser al menos 1"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  try {
    await prisma.course.create({
      data: {
        name, type, description, content, imageUrl, hours, modality,
        startDate: new Date(startDate), endDate: new Date(endDate),
        instructor, ponentes, organizadores: organizadores.length > 0 ? organizadores : undefined,
        spots, dependenciaId: dependenciaId || null,
      },
    })
  } catch {
    return { error: "Error al crear curso" }
  }

  revalidatePath("/admin/cursos")
  revalidatePath("/")
  return { success: true }
}

export async function updateCourseAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const courseId = formData.get("courseId")
  const name = formData.get("name")?.trim()
  const type = formData.get("type")
  const description = formData.get("description")?.trim() || null
  const content = formData.get("content")?.trim() || null
  const imageUrl = formData.get("imageUrl")?.trim() || null
  const depRaw = formData.get("dependenciaId")
  const dependenciaId = depRaw && depRaw !== "none" ? depRaw : null
  const hours = Number(formData.get("hours"))
  const modality = formData.get("modality")
  const startDate = formData.get("startDate")
  const endDate = formData.get("endDate")
  const spotsRaw = formData.get("spots")?.trim()
  const spots = spotsRaw ? Number(spotsRaw) : null
  const status = formData.get("status")

  let ponentes = []
  try { ponentes = JSON.parse(formData.get("ponentes") || "[]") } catch { ponentes = [] }
  let organizadores = []
  try { organizadores = JSON.parse(formData.get("organizadores") || "[]") } catch { organizadores = [] }

  const instructor = ponentes.map((p) => p.name).join(", ") || ""

  if (!courseId) return { error: "ID de curso requerido" }

  const fieldErrors = {}

  if (!name) fieldErrors.name = "Nombre es requerido"
  if (!type || !VALID_TYPES.includes(type)) fieldErrors.type = "Tipo es requerido"
  if (!hours || hours < 1) fieldErrors.hours = "Horas debe ser al menos 1"
  if (!modality || !VALID_MODALITIES.includes(modality)) fieldErrors.modality = "Modalidad es requerida"
  if (!startDate) fieldErrors.startDate = "Fecha de inicio es requerida"
  if (!endDate) fieldErrors.endDate = "Fecha de fin es requerida"
  if (startDate && endDate && new Date(startDate) > new Date(endDate))
    fieldErrors.endDate = "Fecha de fin debe ser posterior al inicio"
  if (ponentes.length === 0) fieldErrors.ponentes = "Selecciona al menos un ponente"
  if (spots !== null && spots < 1) fieldErrors.spots = "Vacantes debe ser al menos 1"
  if (status && !VALID_STATUSES.includes(status)) fieldErrors.status = "Estado no válido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        name, type, description, content, imageUrl, hours, modality,
        startDate: new Date(startDate), endDate: new Date(endDate),
        instructor, ponentes, organizadores: organizadores.length > 0 ? organizadores : null,
        spots, status: status || undefined,
        dependenciaId: dependenciaId || null,
      },
    })
  } catch {
    return { error: "Error al actualizar curso" }
  }

  revalidatePath("/admin/cursos")
  revalidatePath("/")
  return { success: true }
}

export async function deleteCourseAction(courseId) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { _count: { select: { enrollments: true } } },
  })

  if (!course) return { error: "Curso no encontrado" }

  await prisma.course.delete({ where: { id: courseId } })

  revalidatePath("/admin/cursos")
  return { success: true }
}

export async function toggleCourseStatusAction(courseId, newStatus) {
  const { error } = await requireAdmin()
  if (error) return { error }

  if (!VALID_STATUSES.includes(newStatus)) return { error: "Estado no válido" }

  await prisma.course.update({
    where: { id: courseId },
    data: { status: newStatus },
  })

  revalidatePath("/admin/cursos")
  return { success: true }
}
