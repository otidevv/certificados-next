import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DependenciasTable } from "@/components/admin/dependencias-table"

export default async function DependenciasPage({ searchParams }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) redirect("/admin")

  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20
  const search = params.search || ""
  const sedeId = params.sedeId || ""

  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { abbreviation: { contains: search, mode: "insensitive" } },
    ]
  }
  if (sedeId) where.sedeId = sedeId

  const [dependencias, total, sedes] = await Promise.all([
    prisma.dependencia.findMany({
      where,
      include: { sede: { select: { name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.dependencia.count({ where }),
    prisma.sede.findMany({ orderBy: { name: "asc" } }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <DependenciasTable
      data={{ dependencias, total, page, pageSize, totalPages }}
      sedes={sedes}
    />
  )
}
