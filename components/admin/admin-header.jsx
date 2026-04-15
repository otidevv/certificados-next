"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"

const breadcrumbMap = {
  "/admin": "Dashboard",
  "/admin/cursos": "Cursos",
  "/admin/sedes": "Sedes",
  "/admin/dependencias": "Dependencias",
  "/admin/usuarios": "Usuarios",
  "/admin/configuracion": "Configuración",
}

export function AdminHeader() {
  const pathname = usePathname()
  const pageTitle = breadcrumbMap[pathname] || "Dashboard"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
