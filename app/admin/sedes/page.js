import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { SedesTable } from "@/components/admin/sedes-table"

export default async function SedesPage() {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) redirect("/admin")

  const sedes = await prisma.sede.findMany({
    include: { _count: { select: { dependencias: true } } },
    orderBy: { createdAt: "asc" },
  })

  return <SedesTable sedes={sedes} />
}
