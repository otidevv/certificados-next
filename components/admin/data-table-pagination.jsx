"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function getPageNumbers(page, totalPages) {
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("ellipsis")
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
  }
  return pages
}

export function DataTablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className="flex items-center justify-between border-t px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground sm:text-sm">
          <span className="font-medium text-foreground">
            {startItem}-{endItem}
          </span>{" "}
          de <span className="font-medium text-foreground">{total}</span>
        </p>
        <span className="hidden text-muted-foreground sm:inline">·</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="hidden h-7 w-[120px] gap-1 text-xs sm:flex">
            <SelectValue>{pageSize} / página</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} filas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="hidden sm:contents">
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-7 w-7 items-center justify-center text-xs text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            )
          )}
        </span>
        <span className="px-2 text-xs font-medium sm:hidden">
          {page}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
