"use client"

import { useState, useCallback, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, MoreHorizontal, Pencil, Trash2, UserCheck, UserX,
  Users, X, Filter, UserPlus, ShieldCheck, UserMinus,
  KeyRound, Loader2, ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react"
import { UserDialog } from "./user-dialog"
import { UserDeleteDialog } from "./user-delete-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { DataTablePagination } from "./data-table-pagination"
import { toggleUserStatusAction } from "@/app/admin/actions"
import { toast } from "sonner"

const ease = [0.22, 1, 0.36, 1]

const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Administrador",
  user: "Usuario",
}

function formatDate(date) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function roleVariant(role) {
  if (role === "superadmin") return "default"
  if (role === "admin") return "secondary"
  return "outline"
}

function getInitials(name, email) {
  const src = name || email || ""
  return src
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// --- Stats Cards ---
function StatsCards({ total, active, inactive }) {
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0

  const cards = [
    { label: "Total usuarios", value: total, icon: Users, color: "text-primary", bg: "bg-primary/10", sub: null },
    { label: "Activos", value: active, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", sub: total > 0 ? `${activePercent}%` : null },
    { label: "Inactivos", value: inactive, icon: UserMinus, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", sub: total > 0 ? `${100 - activePercent}%` : null },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card, i) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease }}>
          <Card className="py-2 sm:py-3">
            <CardContent className="flex items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4">
              <div className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold tracking-tight sm:text-2xl">{card.value}</p>
                  {card.sub && <span className="text-xs text-muted-foreground">{card.sub}</span>}
                </div>
                <p className="text-[11px] text-muted-foreground sm:text-xs">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// --- Row Actions ---
function RowActions({ user, onEdit, onResetPassword, onDelete, onToggleStatus }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar información
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword}>
          <KeyRound className="mr-2 h-4 w-4" />
          Resetear contraseña
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleStatus}>
          {user.status === "ACTIVE" ? (
            <><UserX className="mr-2 h-4 w-4" />Desactivar usuario</>
          ) : (
            <><UserCheck className="mr-2 h-4 w-4" />Activar usuario</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar usuario
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// --- Active Filters ---
function ActiveFilters({ search, status, role, onClearSearch, onClearStatus, onClearRole, onClearAll }) {
  const hasFilters = search || status || role
  if (!hasFilters) return null

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-2 px-4 pb-3">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Filtros:</span>
      {search && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Búsqueda: &quot;{search}&quot;
          <button onClick={onClearSearch} className="ml-0.5 rounded-sm hover:bg-foreground/10"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      {status && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {status === "ACTIVE" ? "Activos" : "Inactivos"}
          <button onClick={onClearStatus} className="ml-0.5 rounded-sm hover:bg-foreground/10"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      {role && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Rol: {ROLE_LABELS[role] || role}
          <button onClick={onClearRole} className="ml-0.5 rounded-sm hover:bg-foreground/10"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      <button onClick={onClearAll} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
        Limpiar todo
      </button>
    </motion.div>
  )
}

// --- Sortable Header ---
function SortableHeader({ label, field, currentField, currentOrder, onSort, className }) {
  const isActive = currentField === field
  return (
    <TableHead className={className}>
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded-md hover:bg-muted">
        {label}
        {isActive ? (
          currentOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-foreground" /> : <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover/table:opacity-50" />
        )}
      </button>
    </TableHead>
  )
}

// --- Table Skeleton ---
function TableSkeleton({ rows = 5 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i}>
      <TableCell className="pl-2 sm:pl-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-8 w-8 rounded-full sm:h-9 sm:w-9" />
          <div className="space-y-1.5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-20" /></div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-3.5 w-36" /></TableCell>
      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-3.5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-7 w-7 rounded-md" /></TableCell>
    </TableRow>
  ))
}

// --- Main Component ---
export function UsersTable({ data }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNavigating, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteUser, setDeleteUser] = useState(null)
  const [resetPwOpen, setResetPwOpen] = useState(false)
  const [resetPwUser, setResetPwUser] = useState(null)
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [togglingId, setTogglingId] = useState(null)

  const debounceRef = useRef(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const currentSearch = searchParams.get("search") || ""
      if (searchValue !== currentSearch) {
        updateSearchParams({ search: searchValue || undefined })
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const updateSearchParams = useCallback(
    (params) => {
      const newParams = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(params)) {
        if (value) newParams.set(key, value)
        else newParams.delete(key)
      }
      if (!("page" in params)) newParams.delete("page")
      startTransition(() => { router.push(`/admin/usuarios?${newParams.toString()}`) })
    },
    [router, searchParams, startTransition]
  )

  function handleClearSearch() {
    setSearchValue("")
    updateSearchParams({ search: undefined })
  }

  async function handleToggleStatus(user) {
    if (togglingId) return
    setTogglingId(user.id)
    try {
      const result = await toggleUserStatusAction(user.id)
      if (result.error) toast.error(result.error)
      else toast.success(user.status === "ACTIVE" ? "Usuario desactivado" : "Usuario activado")
    } catch { toast.error("Error al cambiar estado") }
    finally { setTogglingId(null) }
  }

  const currentStatus = searchParams.get("status") || ""
  const currentRole = searchParams.get("role") || ""
  const currentSearch = searchParams.get("search")
  const currentSortBy = searchParams.get("sortBy") || "createdAt"
  const currentSortOrder = searchParams.get("sortOrder") || "desc"

  function handleSort(field) {
    if (field === currentSortBy) {
      updateSearchParams({ sortBy: field, sortOrder: currentSortOrder === "asc" ? "desc" : "asc" })
    } else {
      const defaultOrder = field === "createdAt" ? "desc" : "asc"
      updateSearchParams({ sortBy: field, sortOrder: defaultOrder })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestión de usuarios del sistema</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => { setEditUser(null); setDialogOpen(true) }}>
          <UserPlus className="mr-2 h-4 w-4" />Nuevo Usuario
        </Button>
      </motion.div>

      {/* Stats */}
      <StatsCards total={data.total} active={data.activeCount} inactive={data.total - data.activeCount} />

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15, ease }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o email..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9 pr-9" />
                {searchValue && (
                  <button type="button" onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Select value={currentStatus} onValueChange={(value) => updateSearchParams({ status: value === "all" ? undefined : value })}>
                  <SelectTrigger className="sm:w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="INACTIVE">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={currentRole} onValueChange={(value) => updateSearchParams({ role: value === "all" ? undefined : value })}>
                  <SelectTrigger className="sm:w-[170px]"><SelectValue placeholder="Rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            <ActiveFilters
              search={currentSearch}
              status={currentStatus || null}
              role={currentRole || null}
              onClearSearch={handleClearSearch}
              onClearStatus={() => updateSearchParams({ status: undefined })}
              onClearRole={() => updateSearchParams({ role: undefined })}
              onClearAll={() => { setSearchValue(""); updateSearchParams({ search: undefined, status: undefined, role: undefined }) }}
            />
          </AnimatePresence>

          <CardContent className="relative p-0">
            <AnimatePresence>
              {isNavigating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm border">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Cargando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Table className="group/table">
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Usuario" field="name" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} className="pl-2 sm:pl-4" />
                  <SortableHeader label="Email" field="email" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} className="hidden md:table-cell" />
                  <SortableHeader label="Rol" field="role" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortableHeader label="Estado" field="status" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} />
                  <SortableHeader label="Creado" field="createdAt" currentField={currentSortBy} currentOrder={currentSortOrder} onSort={handleSort} className="hidden lg:table-cell" />
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 && !isNavigating ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Users className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">No se encontraron usuarios</p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {currentSearch || currentStatus || currentRole ? "Intenta cambiar los filtros de búsqueda" : "Crea el primer usuario para empezar"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isNavigating && data.users.length === 0 ? (
                  <TableSkeleton rows={5} />
                ) : (
                  data.users.map((user) => {
                    const isToggling = togglingId === user.id
                    return (
                      <TableRow key={user.id} className="group transition-colors">
                        <TableCell className="pl-2 sm:pl-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{user.name || user.email}</p>
                              <p className="truncate text-xs text-muted-foreground sm:hidden">
                                {ROLE_LABELS[user.role] || user.role} · {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={roleVariant(user.role)} className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {isToggling ? (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            ) : (
                              <span className={`inline-block h-2 w-2 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                            )}
                            <span className="text-sm">{user.status === "ACTIVE" ? "Activo" : "Inactivo"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <RowActions
                            user={user}
                            onEdit={() => { setEditUser(user); setDialogOpen(true) }}
                            onResetPassword={() => { setResetPwUser(user); setResetPwOpen(true) }}
                            onDelete={() => { setDeleteUser(user); setDeleteDialogOpen(true) }}
                            onToggleStatus={() => handleToggleStatus(user)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {data.total > 0 && (
              <DataTablePagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={(p) => updateSearchParams({ page: String(p) })}
                onPageSizeChange={(size) => updateSearchParams({ pageSize: String(size), page: "1" })}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <UserDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditUser(null) }} user={editUser} />
      <UserDeleteDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteUser(null) }} user={deleteUser} />
      <ResetPasswordDialog open={resetPwOpen} onOpenChange={(open) => { setResetPwOpen(open); if (!open) setResetPwUser(null) }} user={resetPwUser} />
    </div>
  )
}
