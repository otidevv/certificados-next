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
  ClipboardCheck,
} from "lucide-react"

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

// --- Success Dialog ---
function EnrollmentSuccessDialog({ open, onClose, course }) {
  useEffect(() => {
    if (open) fireConfetti()
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-md mx-4 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top gradient bar */}
            <div className="h-2 bg-gradient-to-r from-unamad via-emerald-500 to-unamad" />

            <div className="px-6 pt-8 pb-6 text-center">
              {/* Animated check icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 300, delay: 0.5 }}
                >
                  <CheckCircle className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-900 mb-1"
              >
                ¡Inscripción exitosa!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-500 mb-6"
              >
                Te has inscrito correctamente en
              </motion.p>

              {/* Course info card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-50 rounded-xl p-4 mb-6 text-left border"
              >
                <p className="font-semibold text-gray-900 text-sm leading-snug mb-3">{course.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateShort(course.startDate)} — {formatDateShort(course.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {course.hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {MODALITY_LABELS[course.modality]}
                  </span>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <Link
                  href="/mis-cursos"
                  className="flex items-center justify-center gap-2 w-full bg-unamad text-white py-3 rounded-xl font-semibold hover:bg-unamad-dark transition-all text-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver mis cursos
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium cursor-pointer"
                >
                  Seguir explorando
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// --- Main Detail Component ---
export function CourseDetail({ course, isEnrolled = false, userRole = null }) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const [enrollError, setEnrollError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  // Check if user just came back from registration with auto-enrollment
  useEffect(() => {
    if (isEnrolled && !showSuccess) {
      // Check if this is a fresh redirect (user just registered and was auto-enrolled)
      const justRegistered = sessionStorage.getItem("just_enrolled_" + course.id)
      if (justRegistered) {
        sessionStorage.removeItem("just_enrolled_" + course.id)
        setShowSuccess(true)
      }
    }
  }, [isEnrolled, course.id])

  const spotsLeft = course.spots ? course.spots - course._count.enrollments : null
  const isFull = spotsLeft !== null && spotsLeft <= 0

  async function handleEnrollClick() {
    if (!session) {
      sessionStorage.setItem("just_enrolled_" + course.id, "1")
      router.push(`/auth/register?redirect=/cursos/${course.id}`)
      return
    }

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
        setShowSuccess(true)
      }
    } catch {
      setEnrollError("Error al conectar con el servidor")
    } finally {
      setEnrolling(false)
    }
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
                    <p className="text-sm text-center text-red-600">{enrollError}</p>
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

      {/* Success celebration dialog */}
      <EnrollmentSuccessDialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        course={course}
      />
    </>
  )
}
