import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function InscritosLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-80" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[1, 2].map((i) => (
          <Card key={i} className="py-2 sm:py-3">
            <CardContent className="flex items-center gap-3 px-4 py-0">
              <Skeleton className="hidden h-9 w-9 rounded-lg sm:block" />
              <div className="space-y-1.5"><Skeleton className="h-6 w-12" /><Skeleton className="h-3 w-20" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-9 w-full" /></CardHeader>
        <CardContent className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
              <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
