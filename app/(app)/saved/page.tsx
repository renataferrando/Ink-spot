import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <div className="tab-shell flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Bookmark className="text-muted-foreground size-12" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold">No saved artists yet</h1>
      <p className="text-muted-foreground mt-2 max-w-xs text-sm">
        Sign in to save favorite artists and access them across devices.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  );
}
