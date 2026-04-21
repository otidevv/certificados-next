import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { DashboardClient } from "@/components/admin/dashboard-client"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const [totalUsers, activeUsers, totalTemplates, recentUsers, usersByMonth, templatesByMonth] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.template.count(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Users created per month (last 6 months)
      prisma.$queryRaw`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as name,
               COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `,
      // Templates created per month (last 6 months)
      prisma.$queryRaw`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as name,
               COUNT(*)::int as count
        FROM "Template"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `,
    ])

  // Merge activity data
  const monthsMap = {}
  for (const row of usersByMonth) {
    monthsMap[row.name] = { name: row.name, usuarios: row.count, plantillas: 0 }
  }
  for (const row of templatesByMonth) {
    if (monthsMap[row.name]) {
      monthsMap[row.name].plantillas = row.count
    } else {
      monthsMap[row.name] = { name: row.name, usuarios: 0, plantillas: row.count }
    }
  }
  const activityData = Object.values(monthsMap)

  return (
    <DashboardClient
      data={{
        userName: session.user.name || session.user.email,
        stats: { totalUsers, activeUsers, totalTemplates },
        recentUsers,
        activityData,
      }}
    />
  )
}
