"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function DashboardAvatar({
  src,
  initials,
  size = "md",
}: {
  src: string | null;
  initials: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  const dim = size === "sm" ? "size-[52px]" : "size-16";
  const textSize = size === "sm" ? "text-[16px]" : "text-[18px]";

  return (
    <div className={cn("bg-surface-3 relative shrink-0 overflow-hidden rounded-full border-4 border-(--bg)", dim)}>
      {showImage ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={size === "sm" ? "52px" : "64px"}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          aria-hidden
          className={cn("text-faint absolute inset-0 flex items-center justify-center font-mono tracking-[0.04em] uppercase select-none", textSize)}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
