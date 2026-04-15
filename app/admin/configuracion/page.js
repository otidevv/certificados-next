import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { SettingsClient } from "@/components/admin/settings-client"

export default async function ConfiguracionPage() {
  const session = await auth()
  if (!session) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) redirect("/auth/login")

  return <SettingsClient user={user} />
}
