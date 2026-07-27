import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin-panel gate. Super admins are sent to /superadmin: they only
 * operate from the Global Super Admin panel, not the per-site admin panel.
 */
export async function guardAdminPanel(userId: string) {
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const list = (roles ?? []).map((r) => r.role as string);
  if (list.includes("super_admin")) throw redirect({ to: "/superadmin" });
  if (!list.includes("admin")) throw redirect({ to: "/dashboard" });
}
