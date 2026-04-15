import prisma from "@/lib/prisma"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { ExploreCourses } from "@/components/explore-courses"

export const dynamic = "force-dynamic"

export default async function CursosPage() {
  const [courses, types, dependencias] = await Promise.all([
    prisma.course.findMany({
      where: { status: { in: ["ABIERTO", "EN_CURSO"] } },
      include: {
        _count: { select: { enrollments: true } },
        dependencia: { select: { name: true, abbreviation: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.course.groupBy({
      by: ["type"],
      where: { status: { in: ["ABIERTO", "EN_CURSO"] } },
      _count: true,
    }),
    prisma.dependencia.findMany({
      where: {
        courses: { some: { status: { in: ["ABIERTO", "EN_CURSO"] } } },
      },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <ExploreCourses courses={courses} types={types} dependencias={dependencias} />
      </main>
      <PublicFooter />
    </div>
  )
}
