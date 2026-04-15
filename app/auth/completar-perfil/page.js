import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { CompleteProfileForm } from "@/components/complete-profile-form"

export default async function CompletarPerfilPage({ searchParams }) {
  const session = await auth()
  if (!session) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { documentType: true, documentNumber: true, firstName: true, paternalSurname: true, maternalSurname: true },
  })

  // If profile is already complete, redirect back
  const params = await searchParams
  const redirectUrl = params.redirect || "/"
  if (user?.documentType && user?.documentNumber && user?.firstName && user?.paternalSurname && user?.maternalSurname) {
    redirect(redirectUrl)
  }

  return <CompleteProfileForm user={user} redirectUrl={redirectUrl} />
}
