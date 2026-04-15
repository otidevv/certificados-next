import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { UsersTable } from "@/components/admin/users-table"

export default async function UsuariosPage({ searchParams }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    redirect("/admin")
  }

  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ""
  const status = params.status || ""
  const role = params.role || ""
  const sortBy = params.sortBy || "createdAt"
  const sortOrder = params.sortOrder || "desc"

  // Build where clause
  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) where.status = status
  if (role) where.role = role

  // Build orderBy
  const orderBy = {}
  orderBy[sortBy] = sortOrder

  const [users, total, activeCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, status: "ACTIVE" } }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <UsersTable
      data={{
        users,
        total,
        activeCount,
        page,
        pageSize,
        totalPages,
      }}
    />
  )
}
