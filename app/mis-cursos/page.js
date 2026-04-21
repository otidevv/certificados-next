import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { MyCourses } from "@/components/my-courses"

export const dynamic = "force-dynamic"

export default async function MisCursosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: { _count: { select: { enrollments: true } } },
      },
    },
    orderBy: { enrolledAt: "desc" },
  })

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      <main className="flex-1">
        <MyCourses enrollments={enrollments} />
      </main>
      <PublicFooter />
    </div>
  )
}
