import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton Loaders for Dashboard Components
 * Provides consistent loading states across all dashboards
 */

export function SkeletonKPI() {
  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="w-12 h-5 rounded" />
      </div>
      <Skeleton className="w-16 h-6 mb-2" />
      <Skeleton className="w-24 h-3" />
      <Skeleton className="w-full h-8 mt-2" />
    </div>
  );
}

export function SkeletonKPISection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {[...Array(6)].map((_, i) => (
        <SkeletonKPI key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="space-y-2">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-32 h-2" />
            </div>
            <Skeleton className="w-8 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
      <Skeleton className="w-48 h-5 mb-4" />
      <Skeleton className="w-full h-40" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="w-64 h-6" />
          <Skeleton className="w-48 h-4" />
        </div>
        <Skeleton className="w-48 h-10" />
      </div>

      {/* KPIs */}
      <SkeletonKPISection />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SkeletonTable rows={8} />
        </div>
        <SkeletonTable rows={8} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-48 h-3" />
        </div>
      </div>
      <Skeleton className="w-full h-20" />
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-sidebar border-sidebar-border">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-48 h-3" />
          </div>
          <Skeleton className="w-16 h-6 rounded" />
        </div>
      ))}
    </div>
  );
}
