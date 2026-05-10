import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/validations/env";
import { Button } from "@/components/ui/button";
import { approveClaim, rejectClaim } from "@/actions/admin/review-claim";

export const metadata: Metadata = { title: "Claims review" };

export default async function ClaimsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (env.ADMIN_USER_ID && user.id !== env.ADMIN_USER_ID) redirect("/explore");

  const admin = getSupabaseAdminClient();
  const { data: claims } = await admin
    .from("claims")
    .select(`
      id, instagram_handle, status, notes, verification_code, created_at,
      artists(handle, display_name)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-medium">Pending claims</h1>

      {!claims || claims.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending claims.</p>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => {
            const artist = Array.isArray(c.artists) ? c.artists[0] : c.artists;
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{artist?.display_name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">@{c.instagram_handle}</p>
                    {c.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={async () => { "use server"; await approveClaim(c.id); }}>
                      <Button type="submit" size="sm" variant="outline" className="gap-1.5">
                        <CheckCircle2 className="size-3.5 text-primary" />
                        Approve
                      </Button>
                    </form>
                    <form action={async () => { "use server"; await rejectClaim(c.id); }}>
                      <Button type="submit" size="sm" variant="outline" className="gap-1.5 text-destructive">
                        <XCircle className="size-3.5" />
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
