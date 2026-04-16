import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { CoursesTable } from "@/components/admin/courses-table"

export default async function CursosPage({ searchParams }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    redirect("/admin")
  }

  const params = await searchParams
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const search = params.search || ""
  const status = params.status || ""
  const type = params.type || ""
  const sortBy = params.sortBy || "createdAt"
  const sortOrder = params.sortOrder || "desc"

  const where = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { instructor: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) where.status = status
  if (type) where.type = type

  const orderBy = {}
  orderBy[sortBy] = sortOrder

  const [courses, total, openCount, totalEnrollments, dependencias, users] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { _count: { select: { enrollments: true } }, dependencia: { select: { name: true, abbreviation: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.course.count({ where }),
    prisma.course.count({ where: { ...where, status: "ABIERTO" } }),
    prisma.enrollment.count(),
    prisma.dependencia.findMany({
      where: { status: true },
      include: { sede: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <CoursesTable
      data={{ courses, total, openCount, totalEnrollments, page, pageSize, totalPages }}
      dependencias={dependencias}
      users={users}
    />
  )
}
