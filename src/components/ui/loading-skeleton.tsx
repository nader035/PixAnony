import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 space-y-3', className)}>
      <Skeleton className="w-full aspect-square rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function SkeletonFeedCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-4 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>

      {/* Artwork */}
      <Skeleton className="w-full aspect-square rounded-xl" />

      {/* Interaction bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Banner */}
      <Skeleton className="w-full h-36 rounded-2xl" />

      {/* Avatar + Info */}
      <div className="flex items-end gap-4 -mt-10 px-4">
        <Skeleton className="h-20 w-20 rounded-full border-4 border-bg flex-shrink-0" />
        <div className="flex-1 space-y-2 pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Bio */}
      <div className="px-4 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 px-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 6,
  columns = 3,
  className,
}: SkeletonProps & { count?: number; columns?: number }) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
