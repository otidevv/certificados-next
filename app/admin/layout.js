import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Toaster } from "@/components/ui/sonner"

export default async function AdminLayout({ children }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar session={session} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  )
}
