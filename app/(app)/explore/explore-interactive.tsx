"use client";

import { type ReactNode, useState, Suspense } from "react";

import { ArtistCardSkeleton, ArtistRowDesktopSkeleton } from "@/components/artist/artist-card-skeleton";
import { ArtistInfiniteList } from "@/components/artist/artist-infinite-list";
import { MapContainer } from "@/components/map/map-container";
import type { ArtistPublic } from "@/types/artist";

interface Props {
  artists: ArtistPublic[];
  initialHasMore: boolean;
  styles?: string;
  /** Server-rendered content (filter chips + section header) slotted between map and list. */
  children?: ReactNode;
}

export function ExploreInteractive({ artists, initialHasMore, styles, children }: Props) {
  const [hoveredArtistId, setHoveredArtistId] = useState<string | null>(null);

  return (
    <>
      {/* Map */}
      <div className="lg:border-hairline h-[42vh] min-h-48 w-full shrink-0 overflow-hidden lg:h-[360px] lg:min-h-0 lg:rounded-[14px] lg:border">
        <Suspense fallback={<div className="bg-muted h-full w-full animate-pulse" />}>
          <MapContainer artists={artists} hoveredArtistId={hoveredArtistId} />
        </Suspense>
      </div>

      {/* Filter chips + section header passed from the server component */}
      {children}

      {/* Artist list */}
      <div className="lg:border-hairline flex flex-col pb-24 lg:mt-2 lg:border-t lg:pt-[18px] lg:pb-0">
        <Suspense
          fallback={
            <>
              <div className="lg:hidden">
                <ArtistCardSkeleton />
                <ArtistCardSkeleton />
                <ArtistCardSkeleton />
              </div>
              <div className="hidden lg:block">
                <ArtistRowDesktopSkeleton />
                <ArtistRowDesktopSkeleton />
                <ArtistRowDesktopSkeleton />
              </div>
            </>
          }
        >
          <ArtistInfiniteList
            initialArtists={artists}
            initialHasMore={initialHasMore}
            styles={styles}
            onArtistHover={setHoveredArtistId}
          />
        </Suspense>
      </div>
    </>
  );
}
