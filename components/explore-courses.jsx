"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  GraduationCap, Clock, User, Search, X, SlidersHorizontal,
} from "lucide-react"

const TYPE_LABELS = {
  CURSO: "Curso", CAPACITACION: "Capacitacion", TALLER: "Taller",
  SEMINARIO: "Seminario", DIPLOMADO: "Diplomado",
  CONFERENCIA: "Conferencia", CONGRESO: "Congreso", SIMPOSIO: "Simposio",
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

const MODALITY_LABELS = {
  PRESENCIAL: "Presencial", VIRTUAL: "Virtual", SEMIPRESENCIAL: "Semipresencial",
}

const SORT_OPTIONS = [
  { value: "recent", label: "Mas recientes" },
  { value: "az", label: "Titulo A-Z" },
  { value: "za", label: "Titulo Z-A" },
  { value: "hours", label: "Mas horas" },
]

function CourseCard({ course }) {
  return (
    <Link href={`/cursos/${course.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
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
        <div className="p-4">
          <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-unamad transition-colors leading-snug line-clamp-2">
            {course.name}
          </h3>
          {course.dependencia && (
            <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <span className="text-unamad">●</span> {course.dependencia.name}
            </p>
          )}
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0" />{course.instructor}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.hours}h</span>
            <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium">{MODALITY_LABELS[course.modality]}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ExploreCourses({ courses, types, dependencias }) {
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedDeps, setSelectedDeps] = useState([])
  const [sortBy, setSortBy] = useState("recent")
  const [showFilters, setShowFilters] = useState(true)

  const filtered = useMemo(() => {
    let result = courses

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.dependencia?.name.toLowerCase().includes(q)
      )
    }

    if (selectedTypes.length > 0) {
      result = result.filter((c) => selectedTypes.includes(c.type))
    }

    if (selectedDeps.length > 0) {
      result = result.filter((c) => c.dependenciaId && selectedDeps.includes(c.dependenciaId))
    }

    if (sortBy === "az") result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === "za") result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    else if (sortBy === "hours") result = [...result].sort((a, b) => b.hours - a.hours)
    else result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return result
  }, [courses, search, selectedTypes, selectedDeps, sortBy])

  function toggleType(type) {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])
  }

  function toggleDep(id) {
    setSelectedDeps((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id])
  }

  function clearAll() {
    setSearch("")
    setSelectedTypes([])
    setSelectedDeps([])
    setSortBy("recent")
  }

  const hasFilters = search || selectedTypes.length > 0 || selectedDeps.length > 0

  return (
    <>
      {/* Header bar */}
      <div className="bg-unamad h-1.5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explora todos los cursos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {filtered.length} de {courses.length}
              {hasFilters && (
                <button onClick={clearAll} className="ml-3 text-unamad hover:underline">Borrar todo</button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Ocultar filtros" : "Filtros"}
              {(selectedTypes.length + selectedDeps.length > 0) && (
                <span className="bg-unamad text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                  {selectedTypes.length + selectedDeps.length}
                </span>
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Sidebar filters */}
          <aside className={`${showFilters ? "block" : "hidden"} sm:block w-full sm:w-56 shrink-0 space-y-6 bg-gray-50 sm:bg-transparent rounded-xl p-4 sm:p-0 border sm:border-0`}>
            {/* Search */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Buscador</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar curso..."
                  className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg focus:border-unamad focus:ring-1 focus:ring-unamad outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Categorias</p>
              <div className="space-y-1.5">
                {types.map(({ type, _count }) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="rounded border-gray-300 text-unamad focus:ring-unamad"
                    />
                    {TYPE_LABELS[type]} <span className="text-gray-400 text-xs">({_count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dependencias */}
            {dependencias.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Entidades</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {dependencias.map((dep) => (
                    <label key={dep.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={selectedDeps.includes(dep.id)}
                        onChange={() => toggleDep(dep.id)}
                        className="rounded border-gray-300 text-unamad focus:ring-unamad"
                      />
                      <span className="truncate">{dep.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Course grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-700">No se encontraron cursos</p>
                <p className="text-sm text-gray-500 mt-1">Intenta cambiar los filtros de busqueda</p>
                {hasFilters && (
                  <button onClick={clearAll} className="mt-3 text-sm text-unamad hover:underline">Borrar filtros</button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
