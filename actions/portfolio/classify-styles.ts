import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { classifyStyle } from "@/lib/ai/style-classifier";

/**
 * Classifies the styles in a portfolio item and writes the results to
 * portfolio_items.detected_styles, .style_confidence, and .claude_description.
 *
 * Intended to be called via next/server `after()` — all errors are caught and
 * logged so that classification failures never break the upload response.
 */
export async function classifyPortfolioItem(itemId: string): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: item, error: lookupError } = await admin
    .from("portfolio_items")
    .select("id, image_url")
    .eq("id", itemId)
    .single();

  if (lookupError) {
    console.error(
      `[classify-styles] lookup failed for item ${itemId}: ${lookupError.message}`,
    );
    return;
  }

  if (!item?.image_url) {
    console.warn(`[classify-styles] item ${itemId} has no image_url — skipping`);
    return;
  }

  try {
    const result = await classifyStyle(item.image_url);

    const { error: updateError } = await admin
      .from("portfolio_items")
      .update({
        detected_styles: result.styles,
        style_confidence: result.confidence,
        claude_description: result.description,
      })
      .eq("id", itemId);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    console.log(
      `[classify-styles] item ${itemId} → styles: [${result.styles.join(", ")}] confidence: ${result.confidence.toFixed(2)}`,
    );
  } catch (err) {
    console.error(`[classify-styles] failed for item ${itemId}:`, err);
  }
}
