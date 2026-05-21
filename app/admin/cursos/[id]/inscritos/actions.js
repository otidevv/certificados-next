"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const VALID_DOCS = ["DNI", "CE", "PASAPORTE"]

async function requireAdmin() {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado" }
  }
  return { session, error: null }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function updateEnrollmentAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const enrollmentId = formData.get("enrollmentId")
  const documentType = formData.get("documentType")
  const documentNumber = formData.get("documentNumber")?.trim()
  const firstName = formData.get("firstName")?.trim()
  const paternalSurname = formData.get("paternalSurname")?.trim()
  const maternalSurname = formData.get("maternalSurname")?.trim()
  const email = formData.get("email")?.trim().toLowerCase()
  const phone = formData.get("phone")?.trim() || null

  if (!enrollmentId) return { error: "ID de inscripción requerido" }

  const fieldErrors = {}

  if (!documentType || !VALID_DOCS.includes(documentType))
    fieldErrors.documentType = "Tipo de documento requerido"
  if (!documentNumber) fieldErrors.documentNumber = "Número de documento requerido"
  else if (documentType === "DNI" && !/^\d{8}$/.test(documentNumber))
    fieldErrors.documentNumber = "DNI debe tener 8 dígitos"
  if (!firstName) fieldErrors.firstName = "Nombres es requerido"
  if (!paternalSurname) fieldErrors.paternalSurname = "Apellido paterno es requerido"
  if (!maternalSurname) fieldErrors.maternalSurname = "Apellido materno es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const current = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true, documentNumber: true },
  })
  if (!current) return { error: "Inscripción no encontrada" }

  // Enforce the @@unique([courseId, documentNumber]) constraint with a friendly
  // message when the admin changes the document number into one already enrolled.
  if (documentNumber !== current.documentNumber) {
    const dup = await prisma.enrollment.findFirst({
      where: {
        courseId: current.courseId,
        documentNumber,
        NOT: { id: enrollmentId },
      },
      select: { id: true },
    })
    if (dup) {
      return { fieldErrors: { documentNumber: "Ya existe otra inscripción con este documento en este curso" } }
    }
  }

  try {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        documentType,
        documentNumber,
        firstName,
        paternalSurname,
        maternalSurname,
        email,
        phone,
      },
    })
  } catch (e) {
    console.error("updateEnrollmentAction error:", e)
    return { error: "No se pudo actualizar la inscripción" }
  }

  revalidatePath(`/admin/cursos/${current.courseId}/inscritos`)
  revalidatePath(`/admin/cursos/${current.courseId}/asistencia`)
  return { success: true }
}
