import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin-panel gate. Super admins without the admin role are sent to /superadmin.
 */
export async function guardAdminPanel(userId: string) {
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  if (profile?.email === "fowadyxu@forexzig.com") {
    throw redirect({ to: "/superadmin" });
  }

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const list = (roles ?? []).map((r) => r.role as string);
  if (list.includes("super_admin") && !list.includes("admin")) throw redirect({ to: "/superadmin" });
  if (!list.includes("admin")) throw redirect({ to: "/dashboard" });
}
