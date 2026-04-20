import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { CourseDetail } from "@/components/course-detail"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"

export const dynamic = "force-dynamic"

export default async function CourseDetailPage({ params }) {
  const { id } = await params

  const [course, session] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    }),
    auth(),
  ])

  if (!course) notFound()

  // Check if logged-in user is already enrolled
  let isEnrolled = false
  if (session?.user?.id) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId: id, userId: session.user.id },
    })
    isEnrolled = !!enrollment
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <CourseDetail course={course} isEnrolled={isEnrolled} userRole={session?.user?.role} />
      </main>
      <PublicFooter />
    </div>
  )
}
