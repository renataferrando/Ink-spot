"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ArtistPublic } from "@/types/artist";

import { ArtistCard } from "./artist-card";
import { ArtistCardSkeleton, ArtistRowDesktopSkeleton } from "./artist-card-skeleton";
import { ArtistRowDesktop } from "./artist-row-desktop";

const PAGE_SIZE = 20;

interface Props {
  initialArtists: ArtistPublic[];
  initialHasMore: boolean;
  styles?: string;
  onArtistHover?: (id: string | null) => void;
}

export function ArtistInfiniteList({ initialArtists, initialHasMore, styles, onArtistHover }: Props) {
  const [artists, setArtists] = useState<ArtistPublic[]>(initialArtists);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const offsetRef = useRef(initialArtists.length);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offsetRef.current) });
      if (styles) params.set("styles", styles);

      const res = await fetch(`/api/artists?${params}`);
      if (!res.ok) return;

      const json = (await res.json()) as { artists: ArtistPublic[]; hasMore: boolean };
      setArtists((prev) => [...prev, ...json.artists]);
      offsetRef.current += json.artists.length;
      setHasMore(json.hasMore);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, styles]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (artists.length === 0 && !loading) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No studios found for this style yet.
      </p>
    );
  }

  return (
    <>
      {artists.map((artist, i) => (
        <div
          key={artist.id}
          onMouseEnter={() => onArtistHover?.(artist.id)}
          onMouseLeave={() => onArtistHover?.(null)}
        >
          <div className="lg:hidden">
            <ArtistCard artist={artist} priority={i < 2} />
          </div>
          <div className="hidden lg:block">
            <ArtistRowDesktop artist={artist} priority={i < 2} />
          </div>
        </div>
      ))}

      {loading && (
        <>
          <div className="lg:hidden">
            <ArtistCardSkeleton />
            <ArtistCardSkeleton />
          </div>
          <div className="hidden lg:block">
            <ArtistRowDesktopSkeleton />
            <ArtistRowDesktopSkeleton />
          </div>
        </>
      )}

      <div ref={sentinelRef} aria-hidden className="h-px" />
    </>
  );
}
