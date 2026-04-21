import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ChangePasswordPublic } from "@/components/change-password-public"

export default async function CambiarContrasenaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  return <ChangePasswordPublic />
}
