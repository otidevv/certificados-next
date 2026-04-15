"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function requireAdmin() {
  const session = await auth()
  if (!session || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado", session: null }
  }
  return { session, error: null }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// --- CREATE USER ---
export async function createUserAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const name = formData.get("name")?.trim()
  const email = formData.get("email")?.trim()
  const password = formData.get("password")
  const role = formData.get("role")

  const fieldErrors = {}

  if (!name) fieldErrors.name = "Nombre es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"
  if (!password) fieldErrors.password = "Contraseña es requerida"
  else if (password.length < 6) fieldErrors.password = "Mínimo 6 caracteres"
  if (!role || !["user", "admin", "superadmin"].includes(role))
    fieldErrors.role = "Rol es requerido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { fieldErrors: { email: "Este email ya está registrado" } }

  const hashedPassword = await bcrypt.hash(password, 12)

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    })
  } catch {
    return { error: "Error al crear usuario" }
  }

  revalidatePath("/admin/usuarios")
  return { success: true }
}

// --- UPDATE USER ---
export async function updateUserAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const userId = formData.get("userId")
  const name = formData.get("name")?.trim()
  const email = formData.get("email")?.trim()
  const role = formData.get("role")

  if (!userId) return { error: "ID de usuario requerido" }

  const fieldErrors = {}

  if (!name) fieldErrors.name = "Nombre es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"
  if (!role || !["user", "admin", "superadmin"].includes(role))
    fieldErrors.role = "Rol es requerido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  })
  if (existing) return { fieldErrors: { email: "Este email ya está registrado" } }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name, email, role },
    })
  } catch {
    return { error: "Error al actualizar usuario" }
  }

  revalidatePath("/admin/usuarios")
  return { success: true }
}

// --- DELETE USER ---
export async function deleteUserAction(userId) {
  const { session, error } = await requireAdmin()
  if (error) return { error }

  if (session.user.id === userId) return { error: "No puedes eliminar tu propia cuenta" }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "Usuario no encontrado" }
  if (user.role === "superadmin") return { error: "No se puede eliminar un Super Administrador" }

  await prisma.user.delete({ where: { id: userId } })

  revalidatePath("/admin/usuarios")
  return { success: true }
}

// --- TOGGLE STATUS ---
export async function toggleUserStatusAction(userId) {
  const { session, error } = await requireAdmin()
  if (error) return { error }

  if (session.user.id === userId) return { error: "No puedes desactivar tu propia cuenta" }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "Usuario no encontrado" }

  await prisma.user.update({
    where: { id: userId },
    data: { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  })

  revalidatePath("/admin/usuarios")
  return { success: true }
}

// --- RESET PASSWORD ---
export async function resetPasswordAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const userId = formData.get("userId")
  const newPassword = formData.get("newPassword")
  const confirmPassword = formData.get("confirmPassword")

  if (!userId) return { error: "ID de usuario requerido" }

  const fieldErrors = {}
  if (!newPassword) fieldErrors.newPassword = "Nueva contraseña es requerida"
  else if (newPassword.length < 6) fieldErrors.newPassword = "Mínimo 6 caracteres"
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirmar contraseña"
  else if (newPassword !== confirmPassword)
    fieldErrors.confirmPassword = "Las contraseñas no coinciden"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "Usuario no encontrado" }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  })

  revalidatePath("/admin/usuarios")
  return { success: true }
}

// --- UPDATE PROFILE (for settings page) ---
export async function updateProfileAction(_prevState, formData) {
  const session = await auth()
  if (!session) return { error: "No autenticado" }

  const name = formData.get("name")?.trim()
  const email = formData.get("email")?.trim()

  const fieldErrors = {}
  if (!name) fieldErrors.name = "Nombre es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: session.user.id } },
  })
  if (existing) return { fieldErrors: { email: "Este email ya está registrado" } }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
  })

  revalidatePath("/admin/configuracion")
  return { success: true }
}

// --- CHANGE PASSWORD (for settings page) ---
export async function changePasswordAction(_prevState, formData) {
  const session = await auth()
  if (!session) return { error: "No autenticado" }

  const currentPassword = formData.get("currentPassword")
  const newPassword = formData.get("newPassword")
  const confirmPassword = formData.get("confirmPassword")

  const fieldErrors = {}
  if (!currentPassword) fieldErrors.currentPassword = "Contraseña actual es requerida"
  if (!newPassword) fieldErrors.newPassword = "Nueva contraseña es requerida"
  else if (newPassword.length < 6) fieldErrors.newPassword = "Mínimo 6 caracteres"
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirmar contraseña"
  else if (newPassword !== confirmPassword)
    fieldErrors.confirmPassword = "Las contraseñas no coinciden"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: "Usuario no encontrado" }

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) return { fieldErrors: { currentPassword: "Contraseña actual incorrecta" } }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  revalidatePath("/admin/configuracion")
  return { success: true }
}
