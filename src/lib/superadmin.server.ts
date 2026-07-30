import type { SupabaseClient } from "@supabase/supabase-js";

type AnyClient = SupabaseClient<any, any, any>;

export async function assertSuperAdmin(supabase: AnyClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (profile?.email === "rupavathivoosa2003@gmail.com") {
    throw new Error("Forbidden: super admin access required");
  }
  const { data, error } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin access required");
  return true;
}

export async function assertAdmin(supabase: AnyClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (profile?.email === "fowadyxu@forexzig.com") {
    throw new Error("Forbidden: admin access required");
  }
  const { data, error } = await supabase.rpc("is_staff", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
  return true;
}

export async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as AnyClient;
}

export async function actorName(supabase: AnyClient, userId: string) {
  const { data } = await supabase.from("profiles").select("name,email").eq("id", userId).maybeSingle();
  return data?.name || data?.email || "Super Admin";
}

export async function writeAudit(
  admin: AnyClient,
  input: {
    actorId: string;
    actorName: string;
    entity: string;
    entityId?: string | null;
    action: string;
    oldValue?: unknown;
    newValue?: unknown;
    ip?: string | null;
    userAgent?: string | null;
    domain?: string | null;
  },
) {
  await admin.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_name: input.actorName,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    action: input.action,
    old_value: (input.oldValue ?? null) as never,
    new_value: (input.newValue ?? null) as never,
    ip_address: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    domain: input.domain ?? null,
  });
}

export async function writeLog(
  admin: AnyClient,
  input: {
    level?: string;
    category?: string;
    actorId?: string | null;
    actorName?: string | null;
    action: string;
    detail?: string | null;
  },
) {
  await admin.from("system_logs").insert({
    level: input.level ?? "info",
    category: input.category ?? "system",
    actor_id: input.actorId ?? null,
    actor_name: input.actorName ?? null,
    action: input.action,
    detail: input.detail ?? null,
  });
}

export async function notify(
  admin: AnyClient,
  input: { type: string; title: string; body?: string; severity?: string; link?: string },
) {
  await admin.from("notifications").insert({
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    severity: input.severity ?? "info",
    link: input.link ?? null,
  });
}

export function randomKey(prefix: string, len = 24) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}${out}`;
}

export function buildPostbackUrl(input: {
  baseUrl: string;
  network: string;
  offerId?: string | null;
  userVariable: string;
  payoutVariable: string;
  statusVariable: string;
  transactionVariable: string;
  secret?: string | null;
}) {
  const params = [
    `network=${encodeURIComponent(input.network)}`,
    `offer_id=${encodeURIComponent(input.offerId ?? "{offer_id}")}`,
    `user_id={${input.userVariable}}`,
    `payout={${input.payoutVariable}}`,
    `status={${input.statusVariable}}`,
    `trans_id={${input.transactionVariable}}`,
    `secret=${input.secret ?? "{secret}"}`,
  ];
  return `${input.baseUrl.replace(/\/$/, "")}/api/public/postback/${slugify(input.network)}?${params.join("&")}`;
}

export function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
