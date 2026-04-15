"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, KeyRound } from "lucide-react"
import { ProfileForm } from "./profile-form"
import { ChangePasswordForm } from "./change-password-form"

export function SettingsClient({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu perfil y seguridad
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Contraseña
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm user={user} />
        </TabsContent>

        <TabsContent value="password">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
