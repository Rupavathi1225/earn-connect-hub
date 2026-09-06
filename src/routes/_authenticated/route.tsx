import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PanelLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (data.user.email === "fowadyxu@forexzig.com") {
      throw redirect({ to: "/superadmin" });
    }
    if (data.user.email === "rupavathivoosa2003@gmail.com" && !location.pathname.startsWith("/admin")) {
      throw redirect({ to: "/admin" });
    }
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  const [profile, setProfile] = useState<{ name: string | null; email: string } | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const list = (roles ?? []).map((r) => r.role as string);

      setIsAdmin(list.includes("admin"));
      const { data: p } = await supabase.from("profiles").select("name,email").eq("id", user.id).maybeSingle();
      if (p) setProfile(p);
    })();
  }, [user.id]);


  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const userLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "🏠" },
    {
      label: "History",
      icon: "📊",
      sub: [
        { label: "Balance", to: "/dashboard", search: { tab: "balance" } },
        { label: "Cash History", to: "/dashboard", search: { tab: "cash_hist" } },
        { label: "Points History", to: "/dashboard", search: { tab: "pts_hist" } },
        { label: "Withdraw History", to: "/dashboard", search: { tab: "withdraw_hist" } },
      ],
    },
    { to: "/dashboard", search: { tab: "edit_account" }, label: "Edit Account", icon: "✏️" },
    {
      label: "Affiliates",
      icon: "📋",
      sub: [
        { label: "Refer a Member", to: "/referrals" },
        { label: "My Referrals", to: "/referrals" },
      ],
    },
    {
      label: "Finance",
      icon: "💰",
      sub: [
        { label: "Withdraw Cash", to: "/withdraw" },
        { label: "Convert Points", to: "/dashboard", search: { tab: "convert_pts" } },
      ],
    },
    {
      label: "Earn Points",
      icon: "📡",
      sub: [
        { label: "Daily Surveys", to: "/surveys" },
        { label: "Promo Code", to: "/promocode" },
      ],
    },
    { to: "/contests", label: "Contests", icon: "🏆" },
    { to: "/announcements", label: "News", icon: "📰" },
    { to: "/tickets", label: "Support Ticket", icon: "🎫" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Overview", icon: "📊" },
    { to: "/admin/users", label: "Users", icon: "👤" },
    { to: "/admin/surveys", label: "Surveys", icon: "📋" },
    { to: "/admin/offerwalls", label: "Offer Walls", icon: "🎯" },
    { to: "/admin/withdrawals", label: "Withdrawals", icon: "💸" },
    { to: "/admin/locked-funds", label: "Locked Funds", icon: "🔒" },
    { to: "/admin/referrals", label: "Referrals", icon: "👥" },
    { to: "/admin/credit-history", label: "Points History", icon: "📜" },
    { to: "/admin/cash-history", label: "Cash History", icon: "💰" },
    { to: "/admin/tickets", label: "Tickets", icon: "🎫" },
    { to: "/admin/announcements", label: "Announcements", icon: "📢" },
    { to: "/admin/promocodes", label: "Promo Codes", icon: "🎁" },
    { to: "/admin/contests", label: "Contests", icon: "🏆" },
    { to: "/admin/chat-feed", label: "Chat Feed", icon: "💬" },
    { to: "/admin/postback-logs", label: "Postback Logs", icon: "📡" },
    { to: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const inAdmin = path.startsWith("/admin");
  const links = inAdmin ? adminLinks : userLinks;

  // Single sidebar-open state drives both the mobile drawer and the desktop
  // ChatGPT-style collapse. Default open on desktop, closed on mobile.
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen((prev) => (window.innerWidth >= 1024 ? prev : false));
    setOpenMenu(null);
  }, [path]);

  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">
      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-[#1a1c3a] text-white transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:h-full lg:shrink-0 lg:overflow-hidden lg:transition-[width,transform] ${
          sidebarOpen
            ? "translate-x-0 lg:w-56 lg:translate-x-0"
            : "-translate-x-full lg:w-0 lg:translate-x-0"
        }`}
      >
        <div className="flex w-64 flex-col lg:w-56">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-extrabold tracking-wider">GLOBAL PRIME</div>
              <div className="text-[10px] italic text-[#f59e0b]">Earn. Complete. Withdraw.</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-sm lg:hidden"
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {links.map((l: any) => {
              const hasSub = !!l.sub;
              if (hasSub) {
                const isOpen = openMenu === l.label;
                return (
                  <div key={l.label} className="flex flex-col">
                    <button
                      onClick={() => setOpenMenu(isOpen ? null : l.label)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#b0b3c5] hover:bg-white/5 text-left transition-all"
                    >
                      <span className="w-5 text-center">{l.icon}</span>
                      <span>{l.label}</span>
                      <span className="ml-auto text-[10px]">{isOpen ? "▾" : "›"}</span>
                    </button>
                    {isOpen && (
                      <div className="bg-[#13152c]/50 py-1 pl-4 flex flex-col border-l border-white/5">
                        {l.sub.map((subItem: any) => (
                          <Link
                            key={subItem.label}
                            to={subItem.to}
                            search={subItem.search}
                            className="flex items-center gap-2 px-4 py-2 text-[11px] text-[#888b9c] hover:text-[#e8734a] [&.active]:text-[#e8734a] [&.active]:font-semibold"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={l.to + (l.search ? JSON.stringify(l.search) : "")}
                  to={l.to}
                  search={l.search}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#b0b3c5] hover:bg-white/5 [&.active]:text-[#e8734a] [&.active]:font-semibold [&.active]:bg-[#e8734a]/10"
                >
                  <span className="w-5 text-center">{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/10 text-xs">
            <div className="mb-2 text-[#b0b3c5] truncate">{profile?.name ?? profile?.email ?? user.email}</div>
            {isAdmin && (
              <Link
                to={inAdmin ? "/dashboard" : "/admin"}
                className="block mb-2 text-center bg-[#5a3dba] hover:bg-[#4a2fa8] rounded py-1.5"
              >
                {inAdmin ? "← User View" : "Admin Panel →"}
              </Link>
            )}

            <button onClick={signOut} className="w-full bg-[#e8734a] hover:bg-[#d66339] rounded py-1.5 font-semibold">
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar with ChatGPT-style sidebar toggle (always visible) */}
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-[#1a1c3a] px-3 py-2.5 text-white">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="text-sm font-extrabold tracking-wider lg:hidden">GLOBAL PRIME</div>
          <div className="ml-auto truncate text-[11px] text-[#b0b3c5]">
            {profile?.name ?? user.email}
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
