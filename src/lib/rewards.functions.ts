import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// User: create withdrawal request
export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      method_code: z.string(),
      amount: z.number().positive(),
      payment_details: z.record(z.string(), z.string()),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p, error: pe } = await supabase.from("profiles").select("cash_balance,currency,points_balance,name,email").eq("id", userId).maybeSingle();
    if (pe || !p) throw new Error("Profile not found");
    if (Number(p.cash_balance) < data.amount) throw new Error("Insufficient cash balance");
    const { data: settings } = await supabase.from("app_settings").select("points_per_inr,points_per_usd").eq("id", 1).maybeSingle();
    const rate = p.currency === "INR" ? Number(settings?.points_per_inr ?? 100) : Number(settings?.points_per_usd ?? 100);
    const points_used = Math.ceil(data.amount * rate);
    if (Number(p.points_balance) < points_used) throw new Error("Insufficient points");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: we } = await supabaseAdmin.from("withdrawals").insert({
      user_id: userId,
      method_code: data.method_code,
      amount: data.amount,
      currency: p.currency,
      points_used,
      payment_details: data.payment_details,
    });
    if (we) throw new Error(we.message);
    await supabaseAdmin.from("profiles").update({
      cash_balance: Number(p.cash_balance) - data.amount,
      points_balance: Number(p.points_balance) - points_used,
    }).eq("id", userId);
    await supabaseAdmin.from("chat_feed").insert({
      user_id: userId,
      event_type: "withdrawal_requested",
      display_name: p.name ?? p.email,
      message: `${p.name ?? p.email} requested a ${p.currency === "INR" ? "₹" : "$"}${data.amount.toFixed(2)} withdrawal`,
    });
    return { ok: true };
  });

// User: redeem promocode
export const redeemPromocode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: promo } = await supabase.from("promocodes").select("*").eq("code", data.code).eq("active", true).maybeSingle();
    if (!promo) throw new Error("Invalid or inactive code");
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new Error("Code expired");
    if (promo.used_count >= promo.usage_limit) throw new Error("Code usage limit reached");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: re } = await supabaseAdmin.from("promocode_redemptions").insert({ promocode_id: promo.id, user_id: userId });
    if (re) throw new Error("You already redeemed this code");
    await supabaseAdmin.from("promocodes").update({ used_count: promo.used_count + 1 }).eq("id", promo.id);
    await supabaseAdmin.rpc("award_points", { _user_id: userId, _points: promo.points, _type: "promocode", _description: `Promo: ${promo.code}`, _reference_id: promo.id });
    return { ok: true, points: promo.points };
  });

// Admin helper: require admin
async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

// Admin: approve/reject withdrawal
export const processWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), action: z.enum(["approve", "reject"]), note: z.string().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: w } = await supabaseAdmin.from("withdrawals").select("*").eq("id", data.id).maybeSingle();
    if (!w || w.status !== "pending") throw new Error("Not pending");
    if (data.action === "approve") {
      await supabaseAdmin.from("withdrawals").update({ status: "approved", admin_note: data.note, processed_at: new Date().toISOString() }).eq("id", data.id);
      const { data: p } = await supabaseAdmin.from("profiles").select("name,email").eq("id", w.user_id).maybeSingle();
      await supabaseAdmin.from("chat_feed").insert({
        user_id: w.user_id, event_type: "withdrawal_approved",
        display_name: p?.name ?? p?.email,
        message: `${p?.name ?? p?.email}'s withdrawal was approved!`,
      });
    } else {
      // refund
      const { data: p } = await supabaseAdmin.from("profiles").select("cash_balance,points_balance").eq("id", w.user_id).maybeSingle();
      if (p) {
        await supabaseAdmin.from("profiles").update({
          cash_balance: Number(p.cash_balance) + Number(w.amount),
          points_balance: Number(p.points_balance) + Number(w.points_used),
        }).eq("id", w.user_id);
      }
      await supabaseAdmin.from("withdrawals").update({ status: "rejected", admin_note: data.note, processed_at: new Date().toISOString() }).eq("id", data.id);
    }
    return { ok: true };
  });

// Admin: manual release locked fund
export const releaseLockedFund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("release_locked_fund", { _id: data.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin: award points manually
export const adminAwardPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid(), points: z.number().int(), description: z.string() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("award_points", { _user_id: data.user_id, _points: data.points, _type: "admin_bonus", _description: data.description });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin: toggle user ban / verified
export const updateUserFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid(), banned: z.boolean().optional(), verified: z.boolean().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.banned !== undefined) patch.banned = data.banned;
    if (data.verified !== undefined) patch.verified = data.verified;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
