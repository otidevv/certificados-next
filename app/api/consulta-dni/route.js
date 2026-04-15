import { NextResponse } from "next/server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get("dni")

  if (!dni || !/^\d{8}$/.test(dni)) {
    return NextResponse.json({ error: "DNI invalido" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://apidatos.unamad.edu.pe/api/consulta/${dni}`, {
      headers: { "Accept": "application/json" },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const data = await res.json()
    return NextResponse.json({
      firstName: data.NOMBRES || null,
      paternalSurname: data.AP_PAT || null,
      maternalSurname: data.AP_MAT || null,
    })
  } catch {
    return NextResponse.json({ error: "Error al consultar" }, { status: 500 })
  }
}
