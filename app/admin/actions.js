"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { validatePassword } from "@/lib/password-policy"
import { sendPasswordChangedNotification } from "@/lib/email"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || !["admin", "superadmin"].includes(session.user.role)) {
    return { error: "No autorizado", session: null }
  }
  return { session, error: null }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizeEmail(raw) {
  return typeof raw === "string" ? raw.trim().toLowerCase() : ""
}

// --- CREATE USER ---
export async function createUserAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const documentType = formData.get("documentType")
  const documentNumber = formData.get("documentNumber")?.trim()
  const firstName = formData.get("firstName")?.trim()
  const paternalSurname = formData.get("paternalSurname")?.trim()
  const maternalSurname = formData.get("maternalSurname")?.trim()
  const email = normalizeEmail(formData.get("email"))
  const password = formData.get("password")
  const role = formData.get("role")

  const fieldErrors = {}

  if (!documentType || !["DNI", "CE", "PASAPORTE"].includes(documentType))
    fieldErrors.documentType = "Tipo de documento requerido"
  if (!documentNumber) fieldErrors.documentNumber = "Número de documento requerido"
  if (!firstName) fieldErrors.firstName = "Nombres es requerido"
  if (!paternalSurname) fieldErrors.paternalSurname = "Apellido paterno es requerido"
  if (!maternalSurname) fieldErrors.maternalSurname = "Apellido materno es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"
  if (!password) fieldErrors.password = "Contraseña es requerida"
  else {
    const pwdErr = validatePassword(password)
    if (pwdErr) fieldErrors.password = pwdErr
  }
  if (!role || !["user", "admin", "superadmin"].includes(role))
    fieldErrors.role = "Rol es requerido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existingEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  })
  if (existingEmail) return { fieldErrors: { email: "Este email ya está registrado" } }

  const existingDoc = await prisma.user.findFirst({
    where: { documentNumber },
    select: { id: true },
  })
  if (existingDoc) return { fieldErrors: { documentNumber: "Este documento ya está registrado" } }

  const hashedPassword = await bcrypt.hash(password, 12)
  const name = `${firstName} ${paternalSurname} ${maternalSurname}`

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role, documentType, documentNumber, firstName, paternalSurname, maternalSurname },
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
  const documentType = formData.get("documentType")
  const documentNumber = formData.get("documentNumber")?.trim()
  const firstName = formData.get("firstName")?.trim()
  const paternalSurname = formData.get("paternalSurname")?.trim()
  const maternalSurname = formData.get("maternalSurname")?.trim()
  const email = normalizeEmail(formData.get("email"))
  const role = formData.get("role")

  if (!userId) return { error: "ID de usuario requerido" }

  const fieldErrors = {}

  if (!documentType || !["DNI", "CE", "PASAPORTE"].includes(documentType))
    fieldErrors.documentType = "Tipo de documento requerido"
  if (!documentNumber) fieldErrors.documentNumber = "Número de documento requerido"
  if (!firstName) fieldErrors.firstName = "Nombres es requerido"
  if (!paternalSurname) fieldErrors.paternalSurname = "Apellido paterno es requerido"
  if (!maternalSurname) fieldErrors.maternalSurname = "Apellido materno es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"
  if (!role || !["user", "admin", "superadmin"].includes(role))
    fieldErrors.role = "Rol es requerido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existingEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, NOT: { id: userId } },
    select: { id: true },
  })
  if (existingEmail) return { fieldErrors: { email: "Este email ya está registrado" } }

  const existingDoc = await prisma.user.findFirst({
    where: { documentNumber, NOT: { id: userId } },
  })
  if (existingDoc) return { fieldErrors: { documentNumber: "Este documento ya está registrado" } }

  const name = `${firstName} ${paternalSurname} ${maternalSurname}`

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name, email, role, documentType, documentNumber, firstName, paternalSurname, maternalSurname },
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

// --- RESET PASSWORD (admin sets password for another user) ---
export async function resetPasswordAction(_prevState, formData) {
  const { error } = await requireAdmin()
  if (error) return { error }

  const userId = formData.get("userId")
  const newPassword = formData.get("newPassword")
  const confirmPassword = formData.get("confirmPassword")

  if (!userId) return { error: "ID de usuario requerido" }

  const fieldErrors = {}
  if (!newPassword) fieldErrors.newPassword = "Nueva contraseña es requerida"
  else {
    const pwdErr = validatePassword(newPassword)
    if (pwdErr) fieldErrors.newPassword = pwdErr
  }
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirmar contraseña"
  else if (newPassword !== confirmPassword)
    fieldErrors.confirmPassword = "Las contraseñas no coinciden"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "Usuario no encontrado" }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    // Stamping passwordChangedAt invalidates any active JWTs for the target
    // user within the next refresh window (~5 min).
    data: { password: hashed, passwordChangedAt: new Date() },
  })

  // Notify the target so they know an admin reset their password.
  sendPasswordChangedNotification(user.email).catch((err) => {
    console.error("Failed to send password-changed email:", err)
  })

  revalidatePath("/admin/usuarios")
  return { success: true }
}

// --- UPDATE PROFILE (for settings page) ---
export async function updateProfileAction(_prevState, formData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autenticado" }

  const name = formData.get("name")?.trim()
  const email = normalizeEmail(formData.get("email"))

  const fieldErrors = {}
  if (!name) fieldErrors.name = "Nombre es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, NOT: { id: session.user.id } },
    select: { id: true },
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
  if (!session?.user?.id) return { error: "No autenticado" }

  const currentPassword = formData.get("currentPassword")
  const newPassword = formData.get("newPassword")
  const confirmPassword = formData.get("confirmPassword")

  const fieldErrors = {}
  if (!currentPassword) fieldErrors.currentPassword = "Contraseña actual es requerida"
  if (!newPassword) fieldErrors.newPassword = "Nueva contraseña es requerida"
  else {
    const pwdErr = validatePassword(newPassword)
    if (pwdErr) fieldErrors.newPassword = pwdErr
  }
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirmar contraseña"
  else if (newPassword !== confirmPassword)
    fieldErrors.confirmPassword = "Las contraseñas no coinciden"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: "Usuario no encontrado" }

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) return { fieldErrors: { currentPassword: "Contraseña actual incorrecta" } }

  if (currentPassword === newPassword) {
    return { fieldErrors: { newPassword: "La nueva contraseña debe ser distinta a la actual" } }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed, passwordChangedAt: new Date() },
  })

  sendPasswordChangedNotification(user.email).catch((err) => {
    console.error("Failed to send password-changed email:", err)
  })

  revalidatePath("/admin/configuracion")
  return { success: true, requiresReauth: true }
}
