import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const { documentType, documentNumber, firstName, paternalSurname, maternalSurname } = await request.json()

    if (!documentType || !documentNumber || !firstName || !paternalSurname || !maternalSurname) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (!["DNI", "CE", "PASAPORTE"].includes(documentType)) {
      return NextResponse.json({ error: "Tipo de documento no valido" }, { status: 400 })
    }

    if (documentType === "DNI" && !/^\d{8}$/.test(documentNumber)) {
      return NextResponse.json({ error: "DNI debe tener exactamente 8 digitos" }, { status: 400 })
    }

    // Check if document number is already used by another user
    const existing = await prisma.user.findFirst({
      where: { documentNumber, NOT: { id: session.user.id } },
    })
    if (existing) {
      return NextResponse.json({ error: "Este numero de documento ya esta registrado" }, { status: 400 })
    }

    const name = `${firstName} ${paternalSurname} ${maternalSurname}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: { documentType, documentNumber, firstName, paternalSurname, maternalSurname, name },
    })

    return NextResponse.json({ message: "Perfil actualizado" })
  } catch (error) {
    console.error("Error al completar perfil:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
