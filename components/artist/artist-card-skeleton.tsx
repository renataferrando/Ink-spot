import { Skeleton } from "@/components/ui/skeleton";

export function ArtistCardSkeleton() {
  return (
    <div className="card" aria-hidden>
      <div className="row">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="thumbs">
        <Skeleton className="aspect-square rounded-[4px]" />
        <Skeleton className="aspect-square rounded-[4px]" />
        <Skeleton className="aspect-square rounded-[4px]" />
      </div>
    </div>
  );
}
