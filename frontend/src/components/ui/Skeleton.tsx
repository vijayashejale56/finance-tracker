interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
    </div>
  )
}

export function TransactionSkeleton({ count = 5 }: SkeletonProps) {
  return (
    <div className="divide-y divide-gray-50 dark:divide-gray-800">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function AccountSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-56 w-full mt-4" />
    </div>
  )
}