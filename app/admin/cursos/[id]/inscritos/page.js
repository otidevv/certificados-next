import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { CourseEnrollmentsTable } from "@/components/admin/course-enrollments-table"

export default async function CursoInscritosPage({ params, searchParams }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    redirect("/admin")
  }

  const { id } = await params
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const pageSize = Number(sp.pageSize) || 10
  const search = sp.search || ""

  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, name: true, type: true, instructor: true, ponentes: true, organizadores: true, spots: true, status: true, startDate: true, endDate: true },
  })

  if (!course) notFound()

  const where = { courseId: id }
  if (search) {
    const words = search.trim().split(/\s+/).filter(Boolean)
    const nameFields = ["firstName", "paternalSurname", "maternalSurname"]
    where.AND = words.map((word) => ({
      OR: [
        ...nameFields.map((field) => ({ [field]: { contains: word, mode: "insensitive" } })),
        { documentNumber: { contains: word, mode: "insensitive" } },
        { email: { contains: word, mode: "insensitive" } },
      ],
    }))
  }

  // Collect user IDs from ponentes and organizadores to fetch their document numbers
  const ponentes = Array.isArray(course.ponentes) ? course.ponentes : []
  const organizadores = Array.isArray(course.organizadores) ? course.organizadores : []
  const userIds = [...ponentes, ...organizadores].map((u) => u.id).filter(Boolean)

  const [enrollments, total, allEnrollments, ponenteUsers] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      orderBy: { enrolledAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where: { courseId: id },
      orderBy: { enrolledAt: "asc" },
      select: { documentNumber: true, firstName: true, paternalSurname: true, maternalSurname: true },
    }),
    userIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, documentNumber: true },
        })
      : [],
  ])

  // Enrich ponentes and organizadores with documentNumber
  const userMap = Object.fromEntries(ponenteUsers.map((u) => [u.id, u]))
  const ponentesWithDoc = ponentes.map((p) => ({ ...p, documentNumber: userMap[p.id]?.documentNumber || "" }))
  const organizadoresWithDoc = organizadores.map((o) => ({ ...o, documentNumber: userMap[o.id]?.documentNumber || "" }))

  const totalPages = Math.ceil(total / pageSize)

  return (
    <CourseEnrollmentsTable
      course={{ ...course, ponentes: ponentesWithDoc, organizadores: organizadoresWithDoc }}
      data={{ enrollments, total, page, pageSize, totalPages, allEnrollments }}
    />
  )
}
