import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/superadmin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: ok } = await supabase.rpc("is_super_admin", { _user_id: data.user.id });
    if (!ok) throw redirect({ to: "/dashboard" });
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Super Admin Control · GlobalPrime" },
      { name: "description", content: "Global super admin control panel for the GlobalPrime rewards network." },
      { property: "og:title", content: "Super Admin Control · GlobalPrime" },
      { property: "og:description", content: "Manage domains, admins, networks, offerwalls and revenue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuperAdminLayout,
});

const NAV: { to: string; icon: string; label: string; group: string }[] = [
  { to: "/superadmin", icon: "📊", label: "Dashboard", group: "Overview" },
  { to: "/superadmin/search", icon: "🔍", label: "Global Search", group: "Overview" },
  { to: "/superadmin/notifications", icon: "🔔", label: "Notifications", group: "Overview" },

  { to: "/superadmin/admins", icon: "👥", label: "Manage Admins", group: "Access" },
  { to: "/superadmin/roles", icon: "🛡", label: "Roles & Permissions", group: "Access" },
  { to: "/superadmin/domains", icon: "🌐", label: "Domains", group: "Access" },

  { to: "/superadmin/users", icon: "👤", label: "Users", group: "Audience" },
  { to: "/superadmin/publishers", icon: "📰", label: "Publishers", group: "Audience" },

  { to: "/superadmin/network-requests", icon: "📋", label: "Network Requests", group: "Traffic" },
  { to: "/superadmin/postback-generator", icon: "🔗", label: "Postback Generator", group: "Traffic" },
  { to: "/superadmin/offerwalls", icon: "📦", label: "Manage Offerwalls", group: "Traffic" },
  { to: "/superadmin/offerwall-postbacks", icon: "🔁", label: "Offerwall Postbacks", group: "Traffic" },

  { to: "/superadmin/revenue", icon: "💰", label: "Revenue & Analytics", group: "Money" },
  { to: "/superadmin/withdrawals", icon: "💸", label: "Withdrawals", group: "Money" },

  { to: "/superadmin/api-keys", icon: "🔑", label: "API Keys", group: "System" },
  { to: "/superadmin/settings", icon: "⚙️", label: "Global Settings", group: "System" },
  { to: "/superadmin/logs", icon: "📜", label: "System Logs", group: "System" },
  { to: "/superadmin/audit", icon: "🧾", label: "Audit Trail", group: "System" },
  { to: "/superadmin/cron", icon: "⏱", label: "Cron Monitor", group: "System" },
  { to: "/superadmin/health", icon: "❤️", label: "System Health", group: "System" },
  { to: "/superadmin/backups", icon: "🗄", label: "Backup Manager", group: "System" },
];

function SuperAdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("sa-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      if (active) setUnread(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("sa-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("sa-theme", next);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const groups = [...new Set(NAV.map((n) => n.group))];
  const title = NAV.find((n) => n.to === path)?.label ?? "Super Admin";
  const initials = (user.email ?? "SA").slice(0, 2).toUpperCase();

  return (
    <div className="sa-root flex h-screen overflow-hidden text-[13px]" data-sa-theme={theme}>
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[220px] shrink-0 flex-col border-r border-[var(--sa-border)] bg-[var(--sa-panel)] transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-[var(--sa-border)] px-4 py-4">
          <div className="text-[15px] font-extrabold tracking-wide">🛡 SUPER ADMIN</div>
          <div className="mt-0.5 text-[10px] text-[var(--sa-muted)]">GlobalPrime Control</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((g) => (
            <div key={g} className="mb-1">
              <div className="px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-widest text-[var(--sa-muted)]">
                {g}
              </div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <Link
                  key={n.to}
                  to={n.to as never}
                  activeOptions={{ exact: n.to === "/superadmin" }}
                  className="flex items-center gap-2.5 border-l-[3px] border-transparent px-4 py-2 text-[11.5px] text-[var(--sa-muted)] transition hover:bg-white/[0.04] [&.active]:border-[var(--sa-accent)] [&.active]:bg-[var(--sa-accent)]/10 [&.active]:font-semibold [&.active]:text-[var(--sa-accent)]"
                >
                  <span className="w-4 text-center">{n.icon}</span>
                  <span className="truncate">{n.label}</span>
                  {n.to === "/superadmin/notifications" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-[var(--sa-border)] px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[10px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-semibold">Super Admin</div>
            <div className="truncate text-[9px] text-[var(--sa-muted)]">{user.email}</div>
          </div>
          <button onClick={signOut} title="Sign out" className="text-[var(--sa-muted)] hover:text-red-400">
            ⎋
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--sa-border)] bg-[var(--sa-panel)] px-5 py-2.5">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <h1 className="text-[13px] font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[9px] text-emerald-400 sm:inline">● System Online</span>
            <Link to="/dashboard" className="text-[10px] text-[var(--sa-muted)] hover:text-[var(--sa-text)]">
              ← App
            </Link>
            <button onClick={toggleTheme} className="text-[13px]" title="Toggle theme">
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5">
          <Outlet />
        </main>
      </div>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
