"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  GraduationCap, Clock, Calendar, User, Users, MapPin,
  Loader2, CheckCircle, ChevronRight, Award,
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
    day: "2-digit", month: "long", year: "numeric",
  })
}

// --- Main Detail Component ---
export function CourseDetail({ course, isEnrolled = false }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const [enrollError, setEnrollError] = useState("")

  const spotsLeft = course.spots ? course.spots - course._count.enrollments : null
  const isFull = spotsLeft !== null && spotsLeft <= 0

  async function handleEnrollClick() {
    if (!session) {
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
                      <div className="flex items-center justify-center gap-2 text-green-600 font-semibold mb-1">
                        <CheckCircle className="h-5 w-5" /> Inscrito exitosamente
                      </div>
                      <p className="text-xs text-gray-500">Ya estas inscrito en este curso</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnrollClick}
                      disabled={isFull || course.status !== "ABIERTO" || enrolling}
                      className="w-full bg-unamad text-white py-3 rounded-lg font-semibold hover:bg-unamad-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Inscribiendo...</>
                      ) : isFull ? "Sin vacantes" : course.status !== "ABIERTO" ? "Inscripciones cerradas" : (
                        <><GraduationCap className="w-5 h-5" />Empezar curso</>
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
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
