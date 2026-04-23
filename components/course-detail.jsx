"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "motion/react"
import {
  GraduationCap, Clock, Calendar, User, Users, MapPin,
  Loader2, CheckCircle, ChevronRight, Award, BookOpen, ArrowRight, X,
  ClipboardCheck, AlertCircle, Printer, CheckCircle2,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TYPE_LABELS = {
  CURSO: "Curso", CAPACITACION: "Capacitacion", TALLER: "Taller",
  SEMINARIO: "Seminario", DIPLOMADO: "Diplomado",
  CONFERENCIA: "Conferencia", CONGRESO: "Congreso", SIMPOSIO: "Simposio",
}

const MODALITY_LABELS = {
  PRESENCIAL: "Presencial", VIRTUAL: "Virtual", SEMIPRESENCIAL: "Semipresencial",
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  })
}

function formatDateShort(date) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", timeZone: "UTC",
  })
}

function fireConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  confetti({ ...defaults, particleCount: 50, origin: { x: 0.2, y: 0.5 } })
  confetti({ ...defaults, particleCount: 50, origin: { x: 0.8, y: 0.5 } })

  setTimeout(() => {
    confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.3 }, spread: 120 })
  }, 200)

  setTimeout(() => {
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.3, y: 0.6 } })
    confetti({ ...defaults, particleCount: 40, origin: { x: 0.7, y: 0.6 } })
  }, 400)
}

// --- Constancia de Inscripción (formal receipt, printable) ---
function buildConstanciaCode(enrollmentId, enrolledAt) {
  const short = (enrollmentId || "").slice(-6).toUpperCase()
  const d = new Date(enrolledAt || 0)
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
  return `INS-${stamp}-${short}`
}

function EnrollmentConstancia({ open, onClose, course, enrollment, isAuthenticated }) {
  useEffect(() => {
    if (open) fireConfetti()
  }, [open])

  if (!enrollment) return null

  const fullName = [enrollment.firstName, enrollment.paternalSurname, enrollment.maternalSurname]
    .filter(Boolean)
    .join(" ")
    .toUpperCase()
  const enrolledAtValue = enrollment.enrolledAt || new Date().toISOString()
  const code = buildConstanciaCode(enrollment.id, enrolledAtValue)
  const enrolledAt = new Date(enrolledAtValue)
  const enrolledAtStr = enrolledAt.toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Lima",
  })

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 constancia-root">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm no-print"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="constancia-card relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer no-print"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Printable area */}
            <div className="constancia-print px-8 pt-10 pb-6">
              {/* Header UNAMAD */}
              <div className="flex items-center gap-4 pb-5 mb-6 border-b-2 border-unamad">
                <img src="/img/logo.png" alt="UNAMAD" className="h-16 w-16 object-contain shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    Universidad Nacional Amazónica de Madre de Dios
                  </p>
                  <p className="text-xs text-gray-500">Sistema de Certificación y Capacitación</p>
                </div>
              </div>

              {/* Success animation (screen only) */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.15 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 no-print"
              >
                <CheckCircle className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
              </motion.div>

              {/* Title */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-gray-900 tracking-wide">CONSTANCIA DE INSCRIPCIÓN</h2>
                <p className="text-sm text-gray-500 mt-1 font-mono tracking-wider">{code}</p>
              </div>

              {/* Body */}
              <div className="text-gray-800 leading-relaxed text-[15px] space-y-3">
                <p>Se deja constancia que:</p>
                <p className="text-center font-bold text-lg text-gray-900 uppercase py-2">
                  {fullName}
                </p>
                <p className="text-center text-sm text-gray-600">
                  Identificado(a) con {enrollment.documentType} N° <span className="font-semibold">{enrollment.documentNumber}</span>
                </p>
                <p>Se ha registrado satisfactoriamente en:</p>
                <div className="bg-gray-50 rounded-lg p-4 border my-3">
                  <p className="font-semibold text-gray-900 text-[15px] leading-snug mb-3">
                    {course.name}
                  </p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    <div>
                      <dt className="text-gray-500">Tipo</dt>
                      <dd className="text-gray-800 font-medium">{TYPE_LABELS[course.type]}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Modalidad</dt>
                      <dd className="text-gray-800 font-medium">{MODALITY_LABELS[course.modality]}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Duración</dt>
                      <dd className="text-gray-800 font-medium">{course.hours} horas</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Fechas</dt>
                      <dd className="text-gray-800 font-medium">
                        {formatDateShort(course.startDate)} — {formatDateShort(course.endDate)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <p className="text-sm text-gray-600">
                  Correo registrado: <span className="font-medium text-gray-800">{enrollment.email}</span>
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
                <span>Registrado el {enrolledAtStr}</span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Válido como comprobante
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 pb-6 space-y-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 w-full bg-unamad text-white py-3 rounded-xl font-semibold hover:bg-unamad-dark transition-all text-sm cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Imprimir / Guardar como PDF
              </button>
              {isAuthenticated ? (
                <Link
                  href="/mis-cursos"
                  className="flex items-center justify-center gap-2 w-full border-2 border-unamad text-unamad py-2.5 rounded-xl font-semibold hover:bg-unamad hover:text-white transition-all text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver mis cursos
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// --- Guest Enrollment Form Dialog ---
function EnrollFormDialog({ open, onClose, course, onSuccess }) {
  const [documentType, setDocumentType] = useState("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  const [firstName, setFirstName] = useState("")
  const [paternalSurname, setPaternalSurname] = useState("")
  const [maternalSurname, setMaternalSurname] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const lookupDni = useCallback(async (dni) => {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) return
    setIsLookingUp(true)
    try {
      const res = await fetch(`/api/consulta-dni?dni=${dni}`)
      if (!res.ok) throw new Error("not found")
      const data = await res.json()
      if (data.firstName) {
        setFirstName(data.firstName)
        setPaternalSurname(data.paternalSurname)
        setMaternalSurname(data.maternalSurname)
        setLookupDone(true)
      }
    } catch {
      // User fills manually
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  useEffect(() => {
    if (documentType !== "DNI" || documentNumber.length !== 8) {
      setLookupDone(false)
      return
    }
    const t = setTimeout(() => lookupDni(documentNumber), 400)
    return () => clearTimeout(t)
  }, [documentNumber, documentType, lookupDni])

  // Reset state when dialog closes so the next opening starts fresh
  useEffect(() => {
    if (!open) {
      setError("")
      setSubmitting(false)
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (!documentType || !documentNumber.trim() || !firstName.trim() || !paternalSurname.trim() || !maternalSurname.trim() || !email.trim()) {
      setError("Completa todos los campos requeridos")
      return
    }
    if (documentType === "DNI" && !/^\d{8}$/.test(documentNumber.trim())) {
      setError("DNI debe tener 8 dígitos")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Correo electrónico inválido")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          documentType,
          documentNumber: documentNumber.trim(),
          firstName: firstName.trim(),
          paternalSurname: paternalSurname.trim(),
          maternalSurname: maternalSurname.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo completar la inscripción")
        return
      }
      onSuccess(data.enrollment)
    } catch {
      setError("Error al conectar con el servidor")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-2 bg-gradient-to-r from-unamad via-emerald-500 to-unamad" />

            <div className="px-6 pt-7 pb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-unamad/10">
                <GraduationCap className="h-6 w-6 text-unamad" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
                Inscripción al curso
              </h2>
              <p className="text-xs text-gray-500 text-center leading-snug mb-5 line-clamp-2 px-2">
                {course.name}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Document */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-700">Tipo doc.</label>
                    <Select
                      value={documentType}
                      onValueChange={(v) => {
                        setDocumentType(v)
                        setDocumentNumber("")
                        setFirstName("")
                        setPaternalSurname("")
                        setMaternalSurname("")
                        setLookupDone(false)
                      }}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-gray-700">N° documento</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder={documentType === "DNI" ? "12345678" : "Número"}
                        required
                        className="w-full h-9 px-3 pr-8 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-unamad/40"
                      />
                      {documentType === "DNI" && isLookingUp && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {documentType === "DNI" && lookupDone && !isLookingUp && (
                        <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div>
                  <label className="text-xs font-medium text-gray-700">Nombres</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nombres completos"
                    required
                    autoComplete="given-name"
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-unamad/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Apellido paterno</label>
                    <input
                      type="text"
                      value={paternalSurname}
                      onChange={(e) => setPaternalSurname(e.target.value)}
                      placeholder="Paterno"
                      required
                      autoComplete="family-name"
                      className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-unamad/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Apellido materno</label>
                    <input
                      type="text"
                      value={maternalSurname}
                      onChange={(e) => setMaternalSurname(e.target.value)}
                      placeholder="Materno"
                      required
                      autoComplete="additional-name"
                      className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-unamad/40"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className="text-xs font-medium text-gray-700">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-unamad/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="999 999 999"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-unamad/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full bg-unamad text-white py-3 rounded-xl font-semibold hover:bg-unamad-dark transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Inscribiendo...</>
                  ) : (
                    <><GraduationCap className="h-4 w-4" /> Confirmar inscripción</>
                  )}
                </button>

                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Al inscribirte recibirás tu constancia. Los datos se usan solo para la inscripción al curso.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// --- Main Detail Component ---
export function CourseDetail({ course, isEnrolled = false, userRole = null }) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const [enrollError, setEnrollError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [lastEnrollment, setLastEnrollment] = useState(null)

  // Surface enrollment failure coming back from registration flow
  useEffect(() => {
    if (searchParams.get("enroll_failed") === "1") {
      setEnrollError("Tu cuenta se creó pero no pudimos inscribirte al curso. Intenta inscribirte manualmente.")
      const url = new URL(window.location.href)
      url.searchParams.delete("enroll_failed")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const spotsLeft = course.spots ? course.spots - course._count.enrollments : null
  const isFull = spotsLeft !== null && spotsLeft <= 0

  async function handleEnrollClick() {
    // Still loading session — ignore click to avoid wrong branch
    if (sessionStatus === "loading") return

    // Guests fill out the inline form (no account required)
    if (!session?.user?.id) {
      setShowForm(true)
      return
    }

    // Authenticated: enroll directly using profile data
    setEnrolling(true)
    setEnrollError("")
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === "INCOMPLETE_PROFILE") {
          router.push(`/auth/completar-perfil?redirect=/cursos/${course.id}`)
        } else {
          setEnrollError(data.error)
        }
      } else {
        setEnrolled(true)
        setLastEnrollment(data.enrollment)
      }
    } catch {
      setEnrollError("Error al conectar con el servidor")
    } finally {
      setEnrolling(false)
    }
  }

  function handleGuestSuccess(enrollment) {
    setShowForm(false)
    setEnrolled(true)
    setLastEnrollment(enrollment)
  }

  return (
    <>
      {/* Hero banner */}
      <div className="relative h-64 sm:h-80 bg-gray-900 overflow-hidden">
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-7xl mx-auto">
            <p className="text-white/70 text-sm mb-2">{TYPE_LABELS[course.type]} · {MODALITY_LABELS[course.modality]}</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">{course.name}</h1>
            <p className="text-white/70 text-sm flex items-center gap-2">
              <User className="h-4 w-4" />{course.instructor}
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-unamad transition-colors">Inicio</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-unamad transition-colors">Cursos</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-800 font-medium truncate max-w-xs">{course.name}</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {course.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{course.name}</h2>
                <p className="text-gray-600 leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-unamad/10">
                  <Clock className="h-5 w-5 text-unamad" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duracion</p>
                  <p className="font-semibold text-gray-900">{course.hours} horas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-unamad/10">
                  <MapPin className="h-5 w-5 text-unamad" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Modalidad</p>
                  <p className="font-semibold text-gray-900">{MODALITY_LABELS[course.modality]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-unamad/10">
                  <Calendar className="h-5 w-5 text-unamad" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de inicio</p>
                  <p className="font-semibold text-gray-900">{formatDate(course.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-unamad/10">
                  <Calendar className="h-5 w-5 text-unamad" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de fin</p>
                  <p className="font-semibold text-gray-900">{formatDate(course.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Content / Temario */}
            {course.content && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contenido del curso</h3>
                <div className="bg-gray-50 rounded-xl p-6 border prose prose-sm max-w-none prose-headings:text-gray-900 prose-li:text-gray-700 prose-p:text-gray-700"
                  dangerouslySetInnerHTML={{ __html: course.content }}
                />
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Card with image and enroll button */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {course.imageUrl && (
                  <img src={course.imageUrl} alt={course.name} className="w-full h-44 object-cover" />
                )}
                <div className="p-5 space-y-4">
                  {enrolled ? (
                    <div className="text-center py-2">
                      <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold mb-1">
                        <CheckCircle className="h-5 w-5" /> Inscrito exitosamente
                      </div>
                      <p className="text-xs text-gray-500">Ya estas inscrito en este curso</p>
                      <Link
                        href="/mis-cursos"
                        className="inline-flex items-center gap-1 text-sm text-unamad font-medium hover:text-unamad-dark transition-colors mt-2"
                      >
                        Ver mis cursos <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnrollClick}
                      disabled={isFull || course.status !== "ABIERTO" || enrolling}
                      className="w-full bg-unamad text-white py-3 rounded-lg font-semibold hover:bg-unamad-dark transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Inscribiendo...</>
                      ) : isFull ? "Sin vacantes" : course.status !== "ABIERTO" ? "Inscripciones cerradas" : (
                        <><GraduationCap className="w-5 h-5" />Inscríbete ahora</>
                      )}
                    </button>
                  )}

                  {enrollError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{enrollError}</span>
                    </div>
                  )}

                  {course.spots && !enrolled && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      {isFull ? "Sin vacantes disponibles" : `${spotsLeft} vacantes disponibles`}
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4 text-unamad shrink-0" />
                      <span>Certificado al finalizar el curso</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor card */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <p className="text-xs text-gray-500 mb-2">Instructor</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-unamad/10">
                    <User className="h-5 w-5 text-unamad" />
                  </div>
                  <p className="font-semibold text-gray-900">{course.instructor}</p>
                </div>
              </div>

              {/* Admin actions */}
              {(userRole === "admin" || userRole === "superadmin") && (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium mb-3 uppercase tracking-wide">
                    Panel de administración
                  </p>
                  <div className="space-y-2">
                    <Link
                      href={`/admin/cursos/${course.id}/asistencia`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Tomar asistencia
                    </Link>
                    <Link
                      href={`/admin/cursos/${course.id}/inscritos`}
                      className="w-full inline-flex items-center justify-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      Ver inscritos <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest enrollment form (anonymous users fill in their data) */}
      <EnrollFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        course={course}
        onSuccess={handleGuestSuccess}
      />

      {/* Constancia de inscripción — shown after successful enrollment */}
      <EnrollmentConstancia
        open={!!lastEnrollment}
        onClose={() => setLastEnrollment(null)}
        course={course}
        enrollment={lastEnrollment}
        isAuthenticated={!!session?.user?.id}
      />
    </>
  )
}
