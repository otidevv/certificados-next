import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(request) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const path = join(process.cwd(), "public", "uploads", "courses", filename)

    await writeFile(path, buffer)

    const url = `/uploads/courses/${filename}`
    return NextResponse.json({ url }, { status: 200 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
