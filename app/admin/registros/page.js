import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { RegistrosTable } from "@/components/admin/registros-table"

export const dynamic = "force-dynamic"

export default async function RegistrosPage({ searchParams }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) redirect("/admin")

  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const searchRaw = params.search || ""
  const search = searchRaw.replace(/[^0-9]/g, "")

  // Años que efectivamente tienen registros, para el selector.
  const yearsGrouped = await prisma.registroMensual.groupBy({
    by: ["year"],
    orderBy: { year: "desc" },
  })
  const years = yearsGrouped.map((y) => y.year)
  const year = Number(params.year) || years[0] || new Date().getFullYear()

  const where = { year }
  if (search) where.documentNumber = { contains: search }

  // Cada persona (documentNumber distinto) es una fila. groupBy da la lista
  // completa de DNIs del año; se pagina en memoria porque son solo strings.
  const distinct = await prisma.registroMensual.groupBy({
    by: ["documentNumber"],
    where,
    orderBy: { documentNumber: "asc" },
  })
  const total = distinct.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageDocs = distinct
    .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    .map((d) => d.documentNumber)

  // Solo se traen los registros de los DNIs de la página actual.
  const registros = pageDocs.length
    ? await prisma.registroMensual.findMany({
        where: { year, documentNumber: { in: pageDocs } },
        select: { documentNumber: true, month: true, regimenLaboral: true, condicion: true },
      })
    : []

  // Matriz DNI × mes: months[n] = { regimenLaboral, condicion } si trabajó ese mes.
  const byDoc = new Map()
  for (const doc of pageDocs) byDoc.set(doc, { documentNumber: doc, months: {} })
  for (const r of registros) {
    byDoc.get(r.documentNumber).months[r.month] = {
      regimenLaboral: r.regimenLaboral,
      condicion: r.condicion,
    }
  }
  const rows = [...byDoc.values()].map((row) => ({
    ...row,
    monthsWorked: Object.keys(row.months).length,
  }))

  const totalRegistros = await prisma.registroMensual.count({ where: { year } })

  return (
    <RegistrosTable
      data={{ rows, total, page, pageSize, totalPages, totalRegistros }}
      years={years}
      year={year}
      search={searchRaw}
    />
  )
}
