import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { btnPrimaryLg, tabShellClass } from "@/lib/ui/classes";

export const metadata: Metadata = { title: "Saved" };

const SHELL_CLASS = cn(tabShellClass, "flex flex-1 flex-col items-center justify-center py-24 text-center");

export default async function SavedPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={SHELL_CLASS}>
        <Bookmark className="text-dim size-10" aria-hidden />
        <h1 className="mt-4 text-[22px] font-medium tracking-[-0.01em]">No saved artists yet</h1>
        <p className="text-dim mt-2 max-w-xs text-[14px] leading-normal">
          Sign in to save favorite artists and access them across devices.
        </p>
        <Link href="/login" className={cn(btnPrimaryLg, "mt-6")}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={SHELL_CLASS}>
      <Bookmark className="text-dim size-10" aria-hidden />
      <h1 className="mt-4 text-[22px] font-medium tracking-[-0.01em]">No saved artists yet</h1>
      <p className="text-dim mt-2 max-w-xs text-[14px] leading-normal">
        Tap the heart on any artist profile to save them here.
      </p>
    </div>
  );
}
