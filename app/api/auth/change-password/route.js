import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contrasena debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Contrasena actual incorrecta" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    })

    return NextResponse.json({ message: "Contrasena actualizada" })
  } catch (error) {
    console.error("Error al cambiar contrasena:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
