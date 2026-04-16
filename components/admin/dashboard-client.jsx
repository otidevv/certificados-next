"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  LayoutDashboard,
  Wrench,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

const ease = [0.22, 1, 0.36, 1]

const quickAccessItems = [
  { title: "Certificados", icon: FileText, href: "/" },
  { title: "Herramientas", icon: Wrench, href: "/herramientas" },
  { title: "Usuarios", icon: Users, href: "/admin/usuarios" },
  { title: "Configuración", icon: Settings, href: "/admin/configuracion" },
]

function StatsCard({ title, value, description, icon: Icon, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

function roleVariant(role) {
  if (role === "superadmin") return "default"
  if (role === "admin") return "secondary"
  return "outline"
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 18) return "Buenas tardes"
  return "Buenas noches"
}

export function DashboardClient({ data }) {
  const { userName, stats, recentUsers, activityData } = data
  const [greeting, setGreeting] = useState("Hola")

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {userName}
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de la actividad del sistema.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Usuarios"
          value={stats.totalUsers}
          description="Usuarios registrados"
          icon={Users}
          index={0}
        />
        <StatsCard
          title="Usuarios Activos"
          value={stats.activeUsers}
          description="Con acceso al sistema"
          icon={UserCheck}
          index={1}
        />
        <StatsCard
          title="Total Plantillas"
          value={stats.totalTemplates}
          description="Plantillas de certificados"
          icon={FileText}
          index={2}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Registros Recientes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Usuarios y plantillas de los últimos 6 meses
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient
                        id="colorUsuarios"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "var(--color-muted-foreground)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="usuarios"
                      stroke="var(--color-primary)"
                      fillOpacity={1}
                      fill="url(#colorUsuarios)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="plantillas"
                      stroke="var(--color-chart-2)"
                      fillOpacity={0.1}
                      fill="var(--color-chart-2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acceso Rápido</CardTitle>
              <p className="text-sm text-muted-foreground">
                Accede a las secciones del sistema
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickAccessItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col items-center gap-2 rounded-xl border p-4 transition-[background-color,border-color] duration-200 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-[transform] duration-200 group-hover:scale-105">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium">{item.title}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Usuarios Recientes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Últimos usuarios registrados en el sistema
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay usuarios registrados aún.
                </p>
              ) : (
                recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {(user.name || user.email)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {user.name || user.email}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={roleVariant(user.role)}>
                        {user.role}
                      </Badge>
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
