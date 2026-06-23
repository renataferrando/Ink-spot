"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { btnPrimaryMd } from "@/lib/ui/classes";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { ArtistPublic } from "@/types/artist";

import { StyleBadges } from "@/components/artist/style-badges";

type MapArtist = Pick<
  ArtistPublic,
  "id" | "handle" | "display_name" | "profile_image_url" | "primary_styles" | "current_location"
>;

interface ArtistMapSheetProps {
  artist: MapArtist | null;
  onClose: () => void;
}

export function ArtistMapSheet({ artist, onClose }: ArtistMapSheetProps) {
  return (
    <Drawer open={artist != null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md px-4 pt-2 pb-8">
          <DrawerHeader className="px-0">
            <div className="flex items-center gap-3">
              <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-full">
                {artist?.profile_image_url ? (
                  <Image
                    src={artist.profile_image_url}
                    alt={artist.display_name ?? ""}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm font-bold">
                    {artist?.display_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <DrawerTitle className="truncate text-base">{artist?.display_name}</DrawerTitle>
                <DrawerDescription className="truncate text-xs">
                  {artist?.current_location?.location_name}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          {artist && (
            <div className="space-y-4">
              <StyleBadges styles={artist.primary_styles} max={4} />
              <Link href={`/artist/${artist.handle}`} className={btnPrimaryMd}>
                View full profile
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
