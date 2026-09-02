import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Builds a signed offerwall URL for the current user.
 * Handles server-side macros like {secure_hash} (md5 of `${userId}-${secret_key}`)
 * so signing secrets never reach the browser.
 */
export const getSignedWallUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { offerwallId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: wall } = await supabaseAdmin
      .from("offerwalls")
      .select("url_template, secret_key")
      .eq("id", data.offerwallId)
      .eq("active", true)
      .maybeSingle();
    if (!wall?.url_template) return { url: null };

    let url = wall.url_template;
    if (url.includes("{secure_hash}")) {
      if (!wall.secret_key) return { url: null };
      const hash = createHash("md5").update(`${context.userId}-${wall.secret_key}`).digest("hex");
      url = url.replaceAll("{secure_hash}", hash);
    }
    return { url };
  });
