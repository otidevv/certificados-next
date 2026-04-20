export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-6 w-72 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  )
}
