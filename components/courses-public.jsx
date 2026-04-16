"use client"

import { useRef } from "react"
import Link from "next/link"
import { GraduationCap, Clock, User } from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"

const TYPE_LABELS = {
  CURSO: "Curso", CAPACITACION: "Capacitacion", TALLER: "Taller",
  SEMINARIO: "Seminario", DIPLOMADO: "Diplomado",
  CONFERENCIA: "Conferencia", CONGRESO: "Congreso", SIMPOSIO: "Simposio",
}

const MODALITY_LABELS = {
  PRESENCIAL: "Presencial", VIRTUAL: "Virtual", SEMIPRESENCIAL: "Semipresencial",
}

const TYPE_COLORS = {
  CURSO: "bg-blue-50 text-blue-700 border-blue-200",
  CAPACITACION: "bg-emerald-50 text-emerald-700 border-emerald-200",
  TALLER: "bg-violet-50 text-violet-700 border-violet-200",
  SEMINARIO: "bg-amber-50 text-amber-700 border-amber-200",
  DIPLOMADO: "bg-rose-50 text-rose-700 border-rose-200",
  CONFERENCIA: "bg-cyan-50 text-cyan-700 border-cyan-200",
  CONGRESO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SIMPOSIO: "bg-teal-50 text-teal-700 border-teal-200",
}

// --- Course Card ---
function CourseCard({ course }) {
  return (
    <Link href={`/cursos/${course.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <GraduationCap className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <span className={`absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${TYPE_COLORS[course.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
            {TYPE_LABELS[course.type]}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-unamad transition-colors leading-snug line-clamp-2">
            {course.name}
          </h3>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />
            {course.instructor}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{course.hours}h
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium">
              {MODALITY_LABELS[course.modality]}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// --- Main Component ---
export function CoursesPublic({ courses }) {
  const coursesRef = useRef(null)

  const scrollToCourses = () => {
    coursesRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background wave/cloud shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: "60%" }}>
            <path d="M0,224 C240,320 480,160 720,192 C960,224 1200,320 1440,256 L1440,320 L0,320 Z" fill="#f3f4f6" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: "50%" }}>
            <path d="M0,256 C180,192 420,320 720,256 C1020,192 1260,288 1440,224 L1440,320 L0,320 Z" fill="#e5e7eb" opacity="0.5" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[70vh] py-12 lg:py-0">
            {/* Left: Text content */}
            <div className="space-y-6 lg:pr-8">
              <div>
                <p className="text-unamad font-semibold text-sm uppercase tracking-wider mb-3">Centro de Capacitacion</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                  CAPACITA-T
                </h1>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
                Encuentra cursos, talleres y capacitaciones para desarrollar y fortalecer tus competencias profesionales.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToCourses}
                  className="inline-flex items-center justify-center gap-2 bg-unamad text-white px-6 py-3 rounded-lg font-semibold hover:bg-unamad-dark transition-all shadow-lg hover:shadow-xl text-sm cursor-pointer"
                >
                  Ver Cursos
                </button>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 border-2 border-unamad text-unamad px-6 py-3 rounded-lg font-semibold hover:bg-unamad-light transition-all text-sm"
                >
                  Registrate para inscribirte
                </Link>
              </div>
            </div>

            {/* Right: Image collage grid */}
            <div className="hidden lg:grid grid-cols-2 grid-rows-3 gap-3 h-[520px]">
              <div className="row-span-2 rounded-2xl overflow-hidden bg-gray-200">
                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=800&fit=crop" alt="Capacitacion" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-gray-200">
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop" alt="Tecnologia" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-gray-200">
                <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop" alt="Ingenieria" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-gray-200">
                <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=300&fit=crop" alt="Estudiantes" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-gray-200">
                <img src="https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=300&fit=crop" alt="Taller" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Diagonal divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 60L1440 0V60H0Z" fill="#db0455" />
          </svg>
        </div>
      </section>

      {/* Accent bar */}
      <div className="bg-unamad h-2" />

      {/* Aliados - infinite scroll marquee */}
      <section className="bg-white py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Aliados</h2>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="marquee-track">
            <div className="marquee-content">
              {[
                { src: "/img/aliados/googlo logo.png", alt: "Google" },
                { src: "/img/aliados/logo-uni2.png", alt: "Universidad 2" },
                { src: "/img/aliados/logo-uni3.jpg", alt: "Universidad 3" },
                { src: "/img/aliados/logo-uni4.png", alt: "Universidad 4" },
                { src: "/img/aliados/logo-unsacc.png", alt: "UNSAAC" },
                { src: "/img/aliados/turninti.png", alt: "Turnitin" },
              ].map((ally, i) => (
                <img key={i} src={ally.src} alt={ally.alt} className="h-10 sm:h-14 w-auto object-contain grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 shrink-0" />
              ))}
            </div>
            <div className="marquee-content" aria-hidden="true">
              {[
                { src: "/img/aliados/googlo logo.png", alt: "Google" },
                { src: "/img/aliados/logo-uni2.png", alt: "Universidad 2" },
                { src: "/img/aliados/logo-uni3.jpg", alt: "Universidad 3" },
                { src: "/img/aliados/logo-uni4.png", alt: "Universidad 4" },
                { src: "/img/aliados/logo-unsacc.png", alt: "UNSAAC" },
                { src: "/img/aliados/turninti.png", alt: "Turnitin" },
              ].map((ally, i) => (
                <img key={i} src={ally.src} alt={ally.alt} className="h-10 sm:h-14 w-auto object-contain grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="cursos" ref={coursesRef} className="bg-gray-50 py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
                <GraduationCap className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay cursos disponibles</h3>
              <p className="text-gray-500">Pronto publicaremos nuevos cursos y capacitaciones.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Cursos Disponibles</h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                  Selecciona un curso y completa tu inscripcion. Puedes inscribirte con o sin cuenta.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 6).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <div className="text-center mt-10">
                <Link
                  href="/cursos"
                  className="inline-flex items-center gap-2 bg-unamad text-white px-8 py-3 rounded-lg font-semibold hover:bg-unamad-dark transition-all text-sm shadow-md hover:shadow-lg"
                >
                  <GraduationCap className="h-5 w-5" />
                  Explorar todos los cursos
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <PublicFooter />

    </div>
  )
}
