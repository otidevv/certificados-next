import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

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

    // Get session
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesion para inscribirte" }, { status: 401 })
    }

    // Get user data from DB (not from JWT, to always have fresh data)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!user.documentType || !user.documentNumber || !user.firstName || !user.paternalSurname || !user.maternalSurname) {
      return NextResponse.json({ error: "Debes completar tu perfil antes de inscribirte", code: "INCOMPLETE_PROFILE" }, { status: 400 })
    }

    // Check duplicate enrollment
    const existing = await prisma.enrollment.findUnique({
      where: { courseId_documentNumber: { courseId, documentNumber: user.documentNumber } },
    })

    if (existing) {
      return NextResponse.json({ error: "Ya estas inscrito en este curso" }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        userId: user.id,
        documentType: user.documentType,
        documentNumber: user.documentNumber,
        firstName: user.firstName,
        paternalSurname: user.paternalSurname,
        maternalSurname: user.maternalSurname,
        email: user.email,
      },
    })

    return NextResponse.json({ message: "Inscripcion exitosa", enrollment: { id: enrollment.id } }, { status: 201 })
  } catch (error) {
    console.error("Error en inscripcion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
