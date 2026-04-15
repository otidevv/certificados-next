"use client"

import Link from "next/link"
import {
  GraduationCap, Clock, Calendar, User, BookOpen, CheckCircle,
} from "lucide-react"

const TYPE_LABELS = {
  CURSO: "Curso", CAPACITACION: "Capacitacion", TALLER: "Taller",
  SEMINARIO: "Seminario", DIPLOMADO: "Diplomado",
  CONFERENCIA: "Conferencia", CONGRESO: "Congreso", SIMPOSIO: "Simposio",
}

const MODALITY_LABELS = {
  PRESENCIAL: "Presencial", VIRTUAL: "Virtual", SEMIPRESENCIAL: "Semipresencial",
}

const STATUS_LABELS = {
  ABIERTO: "Abierto", CERRADO: "Cerrado", EN_CURSO: "En curso", FINALIZADO: "Finalizado",
}

const STATUS_COLORS = {
  ABIERTO: "bg-green-100 text-green-700",
  EN_CURSO: "bg-blue-100 text-blue-700",
  CERRADO: "bg-gray-100 text-gray-700",
  FINALIZADO: "bg-amber-100 text-amber-700",
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export function MyCourses({ enrollments }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-unamad" />
          Mis Cursos
        </h1>
        <p className="text-gray-500 mt-1">Cursos en los que te has inscrito</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
            <GraduationCap className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes cursos aun</h3>
          <p className="text-gray-500 mb-6">Explora los cursos disponibles e inscribete.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-unamad text-white px-6 py-3 rounded-lg font-semibold hover:bg-unamad-dark transition-all text-sm"
          >
            Ver cursos disponibles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course
            return (
              <Link key={enrollment.id} href={`/cursos/${course.id}`} className="block group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <GraduationCap className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${STATUS_COLORS[course.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[course.status]}
                    </span>
                    {/* Enrolled badge */}
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-white/90 text-green-700">
                      <CheckCircle className="h-3 w-3" /> Inscrito
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-[11px] font-medium text-unamad mb-1">{TYPE_LABELS[course.type]}</p>
                    <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-unamad transition-colors leading-snug line-clamp-2">
                      {course.name}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0" />{course.instructor}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{course.hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(course.startDate)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                      Inscrito el {formatDate(enrollment.enrolledAt)}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
