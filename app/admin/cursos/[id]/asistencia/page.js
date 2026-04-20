import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { AttendanceTable } from "@/components/admin/attendance-table"

export const dynamic = "force-dynamic"

export default async function CursoAsistenciaPage({ params }) {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    redirect("/admin")
  }

  const { id } = await params

  const [course, enrollments] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        instructor: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { courseId: id },
      orderBy: [{ paternalSurname: "asc" }, { maternalSurname: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        paternalSurname: true,
        maternalSurname: true,
        documentType: true,
        documentNumber: true,
        email: true,
        attended: true,
      },
    }),
  ])

  if (!course) notFound()

  return <AttendanceTable course={course} enrollments={enrollments} />
}
