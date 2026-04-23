import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateDocument(documentType, documentNumber) {
  if (!["DNI", "CE", "PASAPORTE"].includes(documentType)) {
    return "Tipo de documento no válido"
  }
  if (documentType === "DNI" && !/^\d{8}$/.test(documentNumber)) {
    return "DNI debe tener exactamente 8 dígitos"
  }
  if (documentNumber.length < 5 || documentNumber.length > 20) {
    return "Número de documento inválido"
  }
  return null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { courseId } = body
    if (!courseId) {
      return NextResponse.json({ error: "ID de curso requerido" }, { status: 400 })
    }

    // Check course exists and is open
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { enrollments: true } } },
    })

    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    if (course.status !== "ABIERTO") {
      return NextResponse.json({ error: "Este curso no esta abierto para inscripciones" }, { status: 400 })
    }

    // Check spots
    if (course.spots && course._count.enrollments >= course.spots) {
      return NextResponse.json({ error: "No hay vacantes disponibles" }, { status: 400 })
    }

    const session = await auth()

    // Build the enrollment payload — either from the authenticated user's
    // stored profile or from form fields for guest submissions.
    let documentType, documentNumber, firstName, paternalSurname, maternalSurname, email, phone, userId

    if (session?.user?.id) {
      // --- Authenticated path: use profile data ---
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }
      if (!user.documentType || !user.documentNumber || !user.firstName || !user.paternalSurname || !user.maternalSurname) {
        return NextResponse.json(
          { error: "Debes completar tu perfil antes de inscribirte", code: "INCOMPLETE_PROFILE" },
          { status: 400 },
        )
      }
      documentType = user.documentType
      documentNumber = user.documentNumber
      firstName = user.firstName
      paternalSurname = user.paternalSurname
      maternalSurname = user.maternalSurname
      email = user.email
      phone = null
      userId = user.id
    } else {
      // --- Guest path: rate-limit and validate form data ---
      const ip = getClientIp(request)
      const rl = rateLimit(`enroll-guest:${ip}`, 5, 60 * 60 * 1000)
      if (!rl.ok) {
        return NextResponse.json(
          { error: `Demasiadas inscripciones. Espera ${rl.retryAfter}s.` },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
        )
      }

      documentType = body.documentType
      documentNumber = typeof body.documentNumber === "string" ? body.documentNumber.trim() : ""
      firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
      paternalSurname = typeof body.paternalSurname === "string" ? body.paternalSurname.trim() : ""
      maternalSurname = typeof body.maternalSurname === "string" ? body.maternalSurname.trim() : ""
      email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
      phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null

      if (!documentType || !documentNumber || !firstName || !paternalSurname || !maternalSurname || !email) {
        return NextResponse.json({ error: "Completa todos los campos requeridos" }, { status: 400 })
      }

      const docError = validateDocument(documentType, documentNumber)
      if (docError) {
        return NextResponse.json({ error: docError }, { status: 400 })
      }

      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
      }

      // If a registered user already owns this documentNumber, link the
      // enrollment so it appears in their /mis-cursos later.
      const existingUser = await prisma.user.findFirst({
        where: { documentNumber },
        select: { id: true },
      })
      userId = existingUser?.id || null
    }

    // Duplicate check (compound unique: courseId + documentNumber)
    const existing = await prisma.enrollment.findUnique({
      where: { courseId_documentNumber: { courseId, documentNumber } },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ya estás inscrito en este curso con este documento" },
        { status: 400 },
      )
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId,
        documentType,
        documentNumber,
        firstName,
        paternalSurname,
        maternalSurname,
        email,
        phone,
      },
    })

    return NextResponse.json(
      {
        message: "Inscripción exitosa",
        enrollment: {
          id: enrollment.id,
          documentType: enrollment.documentType,
          documentNumber: enrollment.documentNumber,
          firstName: enrollment.firstName,
          paternalSurname: enrollment.paternalSurname,
          maternalSurname: enrollment.maternalSurname,
          email: enrollment.email,
          enrolledAt: enrollment.enrolledAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error en inscripcion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
