import { Skeleton } from "@/components/ui/skeleton";

export function ArtistCardSkeleton() {
  return (
    <div className="bg-surface border-hairline relative block border-b p-[18px]" aria-hidden>
      <div className="flex items-start gap-3.5">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-1">
        <Skeleton className="aspect-square rounded-[4px]" />
        <Skeleton className="aspect-square rounded-[4px]" />
        <Skeleton className="aspect-square rounded-[4px]" />
      </div>
    </div>
  );
}

export function ArtistRowDesktopSkeleton() {
  return (
    <div
      className="border-hairline grid grid-cols-[64px_minmax(0,1fr)_auto_auto] items-center gap-4 border-b py-4"
      aria-hidden
    >
      <Skeleton className="size-16 rounded-full" />
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="mt-1 h-3 w-2/5" />
        <div className="mt-2 flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-14 rounded-[10px]" />
        <Skeleton className="size-14 rounded-[10px]" />
        <Skeleton className="size-14 rounded-[10px]" />
      </div>
      <Skeleton className="h-9 w-20 rounded-[10px]" />
    </div>
  );
}
