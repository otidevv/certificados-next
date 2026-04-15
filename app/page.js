import prisma from "@/lib/prisma"
import { CoursesPublic } from "@/components/courses-public"

export const dynamic = "force-dynamic"

export default async function Home() {
  const courses = await prisma.course.findMany({
    where: { status: "ABIERTO" },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { startDate: "asc" },
  })

  return <CoursesPublic courses={courses} />
}
