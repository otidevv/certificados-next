"use client"

import { useState, useCallback, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { Search, X, CalendarDays, Loader2, Users, ClipboardList } from "lucide-react"
import { DataTablePagination } from "./data-table-pagination"

const ease = [0.22, 1, 0.36, 1]

const MESES = [
  { n: 1, label: "Ene" }, { n: 2, label: "Feb" }, { n: 3, label: "Mar" },
  { n: 4, label: "Abr" }, { n: 5, label: "May" }, { n: 6, label: "Jun" },
  { n: 7, label: "Jul" }, { n: 8, label: "Ago" }, { n: 9, label: "Set" },
  { n: 10, label: "Oct" }, { n: 11, label: "Nov" }, { n: 12, label: "Dic" },
]
const MESES_LARGO = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"]

export function RegistrosTable({ data, years, year, search }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNavigating, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(search || "")

  const debounceRef = useRef(null)
  const isFirstRender = useRef(true)

  const updateSearchParams = useCallback((params) => {
    const newP = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) { if (v) newP.set(k, v); else newP.delete(k) }
    if (!("page" in params)) newP.delete("page")
    startTransition(() => { router.push(`/admin/registros?${newP.toString()}`) })
  }, [router, searchParams, startTransition])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const cur = searchParams.get("search") || ""
      if (searchValue !== cur) updateSearchParams({ search: searchValue || undefined })
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Registros Mensuales</h1>
          <p className="text-sm text-muted-foreground">
            Meses trabajados por persona según las planillas del organizador de PDFs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1.5">
            <Users className="h-3.5 w-3.5" />{data.total} persona{data.total !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 py-1.5">
            <ClipboardList className="h-3.5 w-3.5" />{data.totalRegistros} registro{data.totalRegistros !== 1 ? "s" : ""} en {year}
          </Badge>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por número de documento..." inputMode="numeric" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9 pr-9" />
                {searchValue && (
                  <button type="button" onClick={() => { setSearchValue(""); updateSearchParams({ search: undefined }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={String(year)} onValueChange={(v) => updateSearchParams({ year: v, page: undefined })}>
                <SelectTrigger className="sm:w-[160px]">
                  <CalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.length === 0 && <SelectItem value={String(year)}>{year}</SelectItem>}
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="relative p-0">
            <AnimatePresence>
              {isNavigating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-sm border">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Cargando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-card pl-4 min-w-[120px]">Documento</TableHead>
                    {MESES.map((m) => (
                      <TableHead key={m.n} className="text-center px-2 min-w-[52px]">{m.label}</TableHead>
                    ))}
                    <TableHead className="text-center pr-4">Meses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.length === 0 && !isNavigating ? (
                    <TableRow>
                      <TableCell colSpan={14} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-muted-foreground">No hay registros para {year}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TooltipProvider delayDuration={150}>
                      {data.rows.map((row) => (
                        <TableRow key={row.documentNumber}>
                          <TableCell className="sticky left-0 z-10 bg-card pl-4">
                            <span className="font-mono text-sm font-medium">{row.documentNumber}</span>
                          </TableCell>
                          {MESES.map((m) => {
                            const cell = row.months[m.n]
                            if (!cell) {
                              return <TableCell key={m.n} className="text-center px-2 text-muted-foreground/30">·</TableCell>
                            }
                            const label = cell.regimenLaboral || "✓"
                            const tip = [
                              `${MESES_LARGO[m.n]} ${year}`,
                              cell.regimenLaboral ? `Régimen: ${cell.regimenLaboral}` : "Sin régimen",
                              cell.condicion ? `Condición: ${cell.condicion}` : "Sin condición",
                            ].join(" · ")
                            return (
                              <TableCell key={m.n} className="text-center px-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block max-w-[64px] truncate rounded bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 align-middle cursor-default">
                                      {label}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{tip}</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center pr-4">
                            <Badge variant="outline" className="font-mono">{row.monthsWorked}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TooltipProvider>
                  )}
                </TableBody>
              </Table>
            </div>

            {data.total > 0 && (
              <DataTablePagination
                page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize}
                onPageChange={(p) => updateSearchParams({ page: String(p) })}
                onPageSizeChange={(size) => updateSearchParams({ pageSize: String(size), page: "1" })}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
