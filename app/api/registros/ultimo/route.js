import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

// Endpoint público (el middleware solo protege /admin). Devuelve el registro
// mensual más reciente de una persona identificada por su número de documento.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get("documento") || searchParams.get("dni") || ""
  const documento = raw.replace(/[^0-9]/g, "")

  if (documento.length < 6 || documento.length > 12) {
    return NextResponse.json(
      { error: "Parámetro 'documento' inválido: debe tener entre 6 y 12 dígitos." },
      { status: 400, headers: CORS },
    )
  }

  try {
    const [ultimo, totalMeses] = await Promise.all([
      // "Último trabajo" = el periodo más reciente, no la fila guardada más
      // recientemente: se ordena por año y mes descendente.
      prisma.registroMensual.findFirst({
        where: { documentNumber: documento },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        select: {
          year: true, month: true, regimenLaboral: true,
          condicion: true, correlativo: true, sourceFile: true, updatedAt: true,
        },
      }),
      prisma.registroMensual.count({ where: { documentNumber: documento } }),
    ])

    if (!ultimo) {
      return NextResponse.json(
        { documento, encontrado: false, error: "No se encontraron registros para este documento." },
        { status: 404, headers: CORS },
      )
    }

    return NextResponse.json(
      {
        documento,
        encontrado: true,
        ultimoTrabajo: {
          year: ultimo.year,
          month: ultimo.month,
          periodo: `${MESES[ultimo.month]} ${ultimo.year}`,
          regimenLaboral: ultimo.regimenLaboral,
          condicion: ultimo.condicion,
          correlativo: ultimo.correlativo,
          sourceFile: ultimo.sourceFile,
          actualizado: ultimo.updatedAt,
        },
        totalMeses,
      },
      { headers: CORS },
    )
  } catch (error) {
    console.error("Error en /api/registros/ultimo:", error)
    return NextResponse.json(
      { error: "Error al consultar los registros." },
      { status: 500, headers: CORS },
    )
  }
}
