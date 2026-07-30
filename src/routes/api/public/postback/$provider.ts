import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Universal postback endpoint for offerwall / survey providers.
 *
 * URL: /api/public/postback/$provider
 *
 * Expected query parameters (map providers to these in their dashboard):
 *   user_id  = the sub_id / aff_sub / ext_user_id you passed when opening the wall
 *   points   = reward amount in points (integer)
 *   tx_id    = the provider's transaction id (for dedupe)
 *   sig      = HMAC-SHA256(secret, `${user_id}:${points}:${tx_id}`) hex — verified when
 *              a POSTBACK_SECRET_<PROVIDER_UPPER> env var is configured.
 *
 * When the secret env var is NOT configured yet, the request is logged with
 * signature_valid=false and NOT credited. To enable a provider, add its
 * secret via Lovable Cloud → Secrets:  POSTBACK_SECRET_CPX_RESEARCH, etc.
 *
 * All calls are recorded in postback_logs regardless of outcome.
 */
export const Route = createFileRoute("/api/public/postback/$provider")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

async function handle({ request, params }: { request: Request; params: { provider: string } }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const url = new URL(request.url);
  const q = Object.fromEntries(url.searchParams.entries());
  const provider = params.provider;
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "";

  const user_id = q.user_id ?? q.sub_id ?? q.uid ?? q.ext_user_id ?? null;
  const points = q.points ? Number(q.points) : q.reward ? Number(q.reward) : null;
  const tx_id = q.tx_id ?? q.transaction_id ?? q.trans_id ?? q.id ?? null;
  const sig = q.sig ?? q.signature ?? q.hash ?? "";

  // Verify signature (only if secret is configured for this provider)
  const secretName = `POSTBACK_SECRET_${provider.toUpperCase()}`;
  const secret = process.env[secretName];
  let signature_valid = false;
  let error: string | null = null;

  if (!secret) {
    error = `Signing secret ${secretName} not configured — request logged but not credited`;
  } else if (!user_id || !points || !tx_id) {
    error = "Missing required params (user_id, points, tx_id)";
  } else {
    const payload = `${user_id}:${points}:${tx_id}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    try {
      const a = Buffer.from(sig, "hex");
      const b = Buffer.from(expected, "hex");
      signature_valid = a.length === b.length && timingSafeEqual(a, b);
      if (!signature_valid) error = "Invalid signature";
    } catch {
      error = "Malformed signature";
    }
  }

  // Look up who created this postback using the secret parameter
  const secretParam = q.secret ?? "";
  let createdByAdminId: string | null = null;
  if (secretParam) {
    const { data: genPb } = await supabaseAdmin
      .from("generated_postbacks")
      .select("admin_id")
      .eq("secret", secretParam)
      .maybeSingle();
    if (genPb) {
      createdByAdminId = genPb.admin_id;
    }
  }

  // Log everything
  const { error: logErr } = await supabaseAdmin.from("postback_logs").insert({
    provider,
    user_id: user_id && /^[0-9a-f-]{36}$/i.test(user_id) ? user_id : null,
    transaction_id: tx_id,
    points,
    raw_payload: q,
    ip_address: ip,
    signature_valid,
    processed: false,
    error,
    created_by_admin_id: createdByAdminId,
  });
  // Dedupe by (provider, tx_id) — insert conflict means already processed
  if (logErr && logErr.code === "23505") {
    return new Response("duplicate", { status: 200 });
  }

  if (!signature_valid || !user_id || !points || points <= 0) {
    return new Response(error ?? "not credited", { status: 200 });
  }

  // Verify user exists
  const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("id", user_id).maybeSingle();
  if (!profile) {
    await supabaseAdmin.from("postback_logs").update({ error: "Unknown user" }).eq("provider", provider).eq("transaction_id", tx_id);
    return new Response("unknown user", { status: 200 });
  }

  // Credit points (award_points applies lock % + writes ledger + chat feed)
  const { error: awardErr } = await supabaseAdmin.rpc("award_points", {
    _user_id: user_id,
    _points: Math.floor(points),
    _type: provider,
    _description: `Reward from ${provider}`,
    _reference_id: tx_id,
  });

  if (awardErr) {
    await supabaseAdmin.from("postback_logs").update({ error: awardErr.message }).eq("provider", provider).eq("transaction_id", tx_id);
    return new Response("error", { status: 500 });
  }

  await supabaseAdmin.from("postback_logs").update({ processed: true, error: null }).eq("provider", provider).eq("transaction_id", tx_id);
  return new Response("1", { status: 200 });
}
