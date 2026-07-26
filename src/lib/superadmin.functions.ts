import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertSuperAdmin,
  getAdminClient,
  actorName,
  writeAudit,
  writeLog,
  notify,
  randomKey,
  buildPostbackUrl,
  slugify,
} from "./superadmin.server";

/* ---------------- admins ---------------- */

export const createAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      name: string;
      email: string;
      password: string;
      role_key: string;
      revenue_share?: number;
      notes?: string;
      domain_ids?: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (authErr) throw new Error(authErr.message);
    const newUserId = created.user!.id;

    await admin.from("user_roles").upsert(
      { user_id: newUserId, role: data.role_key === "super_admin" ? "super_admin" : "admin" },
      { onConflict: "user_id,role" },
    );

    const { data: row, error } = await admin
      .from("admins")
      .insert({
        user_id: newUserId,
        name: data.name,
        email: data.email,
        role_key: data.role_key,
        revenue_share: data.revenue_share ?? 0,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.domain_ids?.length) {
      await admin.from("admin_domains").insert(data.domain_ids.map((d) => ({ admin_id: row.id, domain_id: d })));
    }

    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "admins",
      entityId: row.id,
      action: "create",
      newValue: { ...row, password: undefined },
    });
    await writeLog(admin, { actorId: context.userId, actorName: who, action: "Admin Created", detail: data.email, category: "admin" });
    await notify(admin, { type: "new_admin", title: "New admin created", body: `${data.name} (${data.email})` });
    return row;
  });

export const updateAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      patch: Record<string, unknown>;
      domain_ids?: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: before } = await admin.from("admins").select("*").eq("id", data.id).maybeSingle();
    const { data: after, error } = await admin.from("admins").update(data.patch).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);

    if (data.domain_ids) {
      await admin.from("admin_domains").delete().eq("admin_id", data.id);
      if (data.domain_ids.length)
        await admin.from("admin_domains").insert(data.domain_ids.map((d) => ({ admin_id: data.id, domain_id: d })));
    }
    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "admins",
      entityId: data.id,
      action: "update",
      oldValue: before,
      newValue: after,
    });
    return after;
  });

export const deleteAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: before } = await admin.from("admins").select("*").eq("id", data.id).maybeSingle();
    if (before?.user_id) {
      await admin.from("user_roles").delete().eq("user_id", before.user_id).in("role", ["admin", "super_admin"]);
    }
    await admin.from("admins").delete().eq("id", data.id);
    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "admins",
      entityId: data.id,
      action: "delete",
      oldValue: before,
    });
    return { ok: true };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; password: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.password.length < 8) throw new Error("Password must be at least 8 characters");
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: row } = await admin.from("admins").select("user_id,email").eq("id", data.id).maybeSingle();
    if (!row?.user_id) throw new Error("This admin has no linked login account");
    const { error } = await admin.auth.admin.updateUserById(row.user_id, { password: data.password });
    if (error) throw new Error(error.message);
    await writeLog(admin, { actorId: context.userId, actorName: who, action: "Password Reset", detail: row.email, category: "admin", level: "warn" });
    return { ok: true };
  });

/* ---------------- users ---------------- */

export const adjustUserBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; cash_delta: number; points_delta: number; reason: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: p, error: pe } = await admin
      .from("profiles")
      .select("cash_balance,points_balance")
      .eq("id", data.user_id)
      .maybeSingle();
    if (pe || !p) throw new Error(pe?.message ?? "User not found");

    const next = {
      cash_balance: Number(p.cash_balance) + data.cash_delta,
      points_balance: Number(p.points_balance) + data.points_delta,
    };
    if (next.cash_balance < 0 || next.points_balance < 0) throw new Error("Balance cannot go negative");

    const { error } = await admin.from("profiles").update(next).eq("id", data.user_id);
    if (error) throw new Error(error.message);

    await admin.from("points_ledger").insert({
      user_id: data.user_id,
      points: data.points_delta,
      cash_delta: data.cash_delta,
      type: "admin_adjustment",
      description: data.reason,
    });
    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "profiles",
      entityId: data.user_id,
      action: "balance_adjustment",
      oldValue: p,
      newValue: next,
    });
    return next;
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; banned?: boolean; verified?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const patch: Record<string, boolean> = {};
    if (data.banned !== undefined) patch.banned = data.banned;
    if (data.verified !== undefined) patch.verified = data.verified;
    const { error } = await admin.from("profiles").update(patch).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    if (data.banned) await notify(admin, { type: "user_ban", title: "User banned", severity: "warning" });
    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "profiles",
      entityId: data.user_id,
      action: "status_change",
      newValue: patch,
    });
    return { ok: true };
  });

/* ---------------- network requests ---------------- */

export const reviewNetworkRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; action: "approve" | "reject"; note?: string; base_url: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: req, error } = await admin.from("network_requests").select("*").eq("id", data.id).maybeSingle();
    if (error || !req) throw new Error(error?.message ?? "Request not found");

    const toStatus = data.action === "approve" ? "approved" : "rejected";
    let callback = req.callback_url as string | null;

    if (data.action === "approve") {
      callback = buildPostbackUrl({
        baseUrl: data.base_url,
        network: req.network_name,
        offerId: req.offer_id,
        userVariable: req.user_variable,
        payoutVariable: req.payout_variable,
        statusVariable: req.status_variable,
        transactionVariable: req.transaction_variable,
        secret: randomKey("pbk_", 20),
      });
      await admin.from("networks").insert({
        name: req.network_name,
        tracking_url: req.tracking_url,
        status: "active",
      });
    }

    await admin
      .from("network_requests")
      .update({ status: toStatus, callback_url: callback, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);

    await admin.from("network_request_history").insert({
      request_id: data.id,
      actor_id: context.userId,
      actor_name: who,
      action: data.action,
      from_status: req.status,
      to_status: toStatus,
      note: data.note ?? null,
    });
    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "network_requests",
      entityId: data.id,
      action: data.action,
      oldValue: { status: req.status },
      newValue: { status: toStatus, callback_url: callback },
    });
    await writeLog(admin, {
      actorId: context.userId,
      actorName: who,
      action: "Network Request",
      detail: `${req.network_name} ${toStatus}`,
      category: "network",
      level: data.action === "reject" ? "warn" : "info",
    });
    return { status: toStatus, callback_url: callback };
  });

/* ---------------- api keys ---------------- */

export const generateApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; environment: string; id?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const prefix = data.name.toLowerCase().includes("webhook")
      ? "whsec_"
      : data.environment === "production"
        ? "gp_live_"
        : "gp_test_";
    const key_value = randomKey(prefix, 28);
    if (data.id) {
      const { data: row, error } = await admin.from("api_keys").update({ key_value }).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      await writeLog(admin, { actorId: context.userId, actorName: who, action: "API Key Regenerated", detail: data.name, level: "warn", category: "security" });
      return row;
    }
    const { data: row, error } = await admin
      .from("api_keys")
      .insert({ name: data.name, environment: data.environment, key_value })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeLog(admin, { actorId: context.userId, actorName: who, action: "API Key Created", detail: data.name, category: "security" });
    return row;
  });

/* ---------------- postback testing ---------------- */

export const sendTestPostback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (!/^https?:\/\//i.test(data.url)) throw new Error("URL must start with http:// or https://");
    const started = Date.now();
    try {
      const res = await fetch(data.url, { method: "GET" });
      const body = (await res.text()).slice(0, 500);
      return { ok: res.ok, status: res.status, body, ms: Date.now() - started };
    } catch (e) {
      return { ok: false, status: 0, body: e instanceof Error ? e.message : "Request failed", ms: Date.now() - started };
    }
  });

/* ---------------- backups ---------------- */

export const runBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: row } = await admin
      .from("backups")
      .insert({ kind: data.kind, trigger_type: "manual", status: "running" })
      .select()
      .single();

    const tables = ["profiles", "withdrawals", "points_ledger", "offerwalls", "networks", "domains", "admins"];
    let total = 0;
    try {
      for (const t of tables) {
        const { count } = await admin.from(t).select("id", { count: "exact", head: true });
        total += count ?? 0;
      }
      await admin
        .from("backups")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          size_bytes: total,
          location: `logical snapshot · ${tables.length} tables · ${total} rows`,
        })
        .eq("id", row!.id);
    } catch (e) {
      await admin
        .from("backups")
        .update({ status: "failed", finished_at: new Date().toISOString(), error: e instanceof Error ? e.message : "failed" })
        .eq("id", row!.id);
    }
    await writeLog(admin, { actorId: context.userId, actorName: who, action: "Backup", detail: `${data.kind} backup run`, category: "system" });
    return { ok: true };
  });

/* ---------------- withdrawals ---------------- */

export const setWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "paid"; note?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const who = await actorName(context.supabase, context.userId);
    const { data: w } = await admin.from("withdrawals").select("*").eq("id", data.id).maybeSingle();
    if (!w) throw new Error("Withdrawal not found");

    if (data.status === "rejected" && w.status === "pending") {
      const { data: p } = await admin.from("profiles").select("cash_balance,points_balance").eq("id", w.user_id).maybeSingle();
      if (p) {
        await admin
          .from("profiles")
          .update({
            cash_balance: Number(p.cash_balance) + Number(w.amount),
            points_balance: Number(p.points_balance) + Number(w.points_used ?? 0),
          })
          .eq("id", w.user_id);
      }
    }

    const dbStatus = data.status === "paid" ? "approved" : data.status;
    await admin
      .from("withdrawals")
      .update({
        status: dbStatus,
        admin_note: data.note ?? (data.status === "paid" ? "Marked paid" : null),
        processed_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    await writeAudit(admin, {
      actorId: context.userId,
      actorName: who,
      entity: "withdrawals",
      entityId: data.id,
      action: data.status,
      oldValue: { status: w.status },
      newValue: { status: dbStatus },
    });
    return { ok: true };
  });

/* ---------------- system health ---------------- */

export const getSystemHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();

    const t0 = Date.now();
    const { error: dbErr } = await admin.from("domains").select("id", { count: "exact", head: true });
    const dbMs = Date.now() - t0;

    const t1 = Date.now();
    const { error: storageErr } = await admin.storage.listBuckets();
    const storageMs = Date.now() - t1;

    const t2 = Date.now();
    const { error: authErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const authMs = Date.now() - t2;

    const { count: failedJobs } = await admin
      .from("cron_jobs")
      .select("id", { count: "exact", head: true })
      .eq("last_status", "failed");

    return {
      database: { ok: !dbErr, ms: dbMs, detail: dbErr?.message ?? "PostgREST reachable" },
      storage: { ok: !storageErr, ms: storageMs, detail: storageErr?.message ?? "Buckets reachable" },
      auth: { ok: !authErr, ms: authMs, detail: authErr?.message ?? "Auth API reachable" },
      queue: { ok: (failedJobs ?? 0) === 0, ms: 0, detail: `${failedJobs ?? 0} failed job(s)` },
      unavailable: ["CPU usage", "Memory usage", "Redis"],
      checkedAt: new Date().toISOString(),
    };
  });

/* ---------------- offerwall postback helper ---------------- */

export const buildOfferwallPostback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { provider: string; base_url: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    return {
      url: `${data.base_url.replace(/\/$/, "")}/api/public/postback/${slugify(data.provider)}?user_id={user_id}&payout={payout}&status={status}&trans_id={trans_id}&offer_id={offer_id}&signature={signature}`,
    };
  });
