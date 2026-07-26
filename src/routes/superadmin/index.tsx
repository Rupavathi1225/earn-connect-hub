import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  StatCard,
  SectionTitle,
  Badge,
  Loading,
  ErrorState,
  Empty,
} from "@/components/superadmin/kit";
import { fmtDate } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/superadmin/")({
  head: () => ({
    meta: [
      { title: "Super Admin Dashboard · GlobalPrime" },
      { name: "description", content: "Platform-wide metrics for admins, users, revenue and networks." },
      { property: "og:title", content: "Super Admin Dashboard · GlobalPrime" },
      { property: "og:description", content: "Platform-wide metrics for admins, users, revenue and networks." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

async function loadDashboard() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const since = new Date(Date.now() - 29 * 86400000);

  const count = (t: string, build?: (q: any) => any) => {
    const q = supabase.from(t).select("id", { count: "exact", head: true });
    return build ? build(q) : q;
  };

  const [
    admins,
    users,
    publishers,
    networks,
    offerwalls,
    pendingReq,
    withdrawals,
    pendingWd,
    domains,
    revenueRows,
    recentReq,
    recentLogs,
    recentUsers,
    recentWd,
    recentPb,
    owRevenue,
    netRevenue,
    domainRevenue,
    regRows,
    cronRows,
  ] = await Promise.all([
    count("admins"),
    count("profiles"),
    count("publishers"),
    count("networks"),
    count("offerwalls", (q: any) => q.eq("active", true)),
    count("network_requests", (q: any) => q.eq("status", "pending")),
    count("withdrawals"),
    count("withdrawals", (q: any) => q.eq("status", "pending")),
    count("domains"),
    supabase.from("revenue_reports").select("day,revenue,payout").gte("day", since.toISOString().slice(0, 10)),
    supabase.from("network_requests").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("id,name,email,created_at,points_balance").order("created_at", { ascending: false }).limit(6),
    supabase.from("withdrawals").select("id,amount,currency,status,created_at,method_code").order("created_at", { ascending: false }).limit(6),
    supabase.from("postbacks").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("offerwalls").select("display_name,revenue").order("revenue", { ascending: false }).limit(6),
    supabase.from("networks").select("name,revenue,conversions").order("revenue", { ascending: false }).limit(6),
    supabase.from("domains").select("id,domain,status"),
    supabase.from("profiles").select("created_at").gte("created_at", since.toISOString()),
    supabase.from("cron_jobs").select("*"),
  ]);

  const rev = revenueRows.data ?? [];
  const sum = (rows: { revenue: number | string }[]) => rows.reduce((a, r) => a + Number(r.revenue || 0), 0);
  const todayKey = startOfDay.toISOString().slice(0, 10);
  const monthKey = startOfMonth.toISOString().slice(0, 10);

  const byDay = new Map<string, number>();
  for (const r of rev) byDay.set(r.day as string, (byDay.get(r.day as string) ?? 0) + Number(r.revenue || 0));
  const daily = [...byDay.entries()].sort().map(([day, revenue]) => ({ day: day.slice(5), revenue }));

  const byMonth = new Map<string, number>();
  for (const r of rev) {
    const m = String(r.day).slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + Number(r.revenue || 0));
  }
  const monthly = [...byMonth.entries()].sort().map(([m, revenue]) => ({ month: m, revenue }));

  const regByDay = new Map<string, number>();
  for (const r of regRows.data ?? []) {
    const d = String(r.created_at).slice(0, 10);
    regByDay.set(d, (regByDay.get(d) ?? 0) + 1);
  }
  const registrations = [...regByDay.entries()].sort().map(([day, users]) => ({ day: day.slice(5), users }));

  const domainRev = new Map<string, number>();
  for (const r of rev as any[]) domainRev.set(r.domain_id ?? "unassigned", 0);

  return {
    cards: {
      admins: admins.count ?? 0,
      users: users.count ?? 0,
      publishers: publishers.count ?? 0,
      networks: networks.count ?? 0,
      offerwalls: offerwalls.count ?? 0,
      pendingReq: pendingReq.count ?? 0,
      totalRevenue: sum(rev as any),
      todayRevenue: sum((rev as any).filter((r: any) => r.day === todayKey)),
      monthRevenue: sum((rev as any).filter((r: any) => r.day >= monthKey)),
      withdrawals: withdrawals.count ?? 0,
      pendingWd: pendingWd.count ?? 0,
      domains: domains.count ?? 0,
    },
    daily,
    monthly,
    registrations,
    recentReq: recentReq.data ?? [],
    recentLogs: recentLogs.data ?? [],
    recentUsers: recentUsers.data ?? [],
    recentWd: recentWd.data ?? [],
    recentPb: recentPb.data ?? [],
    topOfferwalls: owRevenue.data ?? [],
    topNetworks: netRevenue.data ?? [],
    domains: domainRevenue.data ?? [],
    cron: cronRows.data ?? [],
    domainRev,
  };
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["sa", "dashboard"], queryFn: loadDashboard, refetchInterval: 60000 });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <Empty />;

  const c = data.cards;
  const cards = [
    { label: "Total Admins", value: c.admins, accent: "var(--sa-blue)" },
    { label: "Total Users", value: c.users.toLocaleString(), accent: "var(--sa-purple)" },
    { label: "Total Publishers", value: c.publishers, accent: "var(--sa-accent)" },
    { label: "Total Networks", value: c.networks, accent: "var(--sa-green)" },
    { label: "Active Offerwalls", value: c.offerwalls, accent: "var(--sa-green)" },
    { label: "Pending Network Requests", value: c.pendingReq, accent: "var(--sa-yellow)" },
    { label: "Total Revenue", value: money(c.totalRevenue), accent: "var(--sa-green)" },
    { label: "Today's Revenue", value: money(c.todayRevenue), accent: "var(--sa-green)" },
    { label: "Monthly Revenue", value: money(c.monthRevenue), accent: "var(--sa-green)" },
    { label: "Total Withdrawals", value: c.withdrawals, accent: "var(--sa-orange, var(--sa-yellow))" },
    { label: "Pending Withdrawals", value: c.pendingWd, accent: "var(--sa-red)" },
    { label: "Total Domains", value: c.domains, accent: "var(--sa-purple)" },
  ];

  const axis = { stroke: "var(--sa-muted)", fontSize: 10 };
  const tooltipStyle = {
    background: "var(--sa-card)",
    border: "1px solid var(--sa-border)",
    borderRadius: 8,
    fontSize: 11,
    color: "var(--sa-text)",
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((x) => (
          <StatCard key={x.label} label={x.label} value={x.value} accent={x.accent} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Revenue Growth (30 days)</SectionTitle>
          {data.daily.length === 0 ? (
            <Empty>No revenue recorded yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sa-border)" />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98133" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>User Registrations (30 days)</SectionTitle>
          {data.registrations.length === 0 ? (
            <Empty>No signups in this window.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sa-border)" />
                <XAxis dataKey="day" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Monthly Earnings</SectionTitle>
          {data.monthly.length === 0 ? (
            <Empty>No revenue recorded yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sa-border)" />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Network Performance</SectionTitle>
          {data.topNetworks.length === 0 ? (
            <Empty>No networks yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topNetworks as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sa-border)" />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <SectionTitle>Recent Network Requests</SectionTitle>
          <ul className="space-y-2">
            {data.recentReq.length === 0 && <Empty />}
            {(data.recentReq as any[]).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-b border-[var(--sa-border)] pb-1.5 text-[11px]">
                <span className="truncate">
                  <span className="text-[var(--sa-text)]">{r.network_name}</span>
                  <span className="text-[var(--sa-muted)]"> · {r.admin_name ?? "admin"}</span>
                </span>
                <Badge>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Recent Admin Activity</SectionTitle>
          <ul className="space-y-2">
            {data.recentLogs.length === 0 && <Empty />}
            {(data.recentLogs as any[]).map((l) => (
              <li key={l.id} className="border-b border-[var(--sa-border)] pb-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--sa-text)]">{l.action}</span>
                  <Badge tone={l.level === "error" ? "red" : l.level === "warn" ? "yellow" : "blue"}>{l.level}</Badge>
                </div>
                <div className="truncate text-[10px] text-[var(--sa-muted)]">{l.detail}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Recent User Activity</SectionTitle>
          <ul className="space-y-2">
            {data.recentUsers.length === 0 && <Empty />}
            {(data.recentUsers as any[]).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 border-b border-[var(--sa-border)] pb-1.5 text-[11px]">
                <span className="truncate">{u.name || u.email}</span>
                <span className="text-[10px] text-[var(--sa-muted)]">{fmtDate(u.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Recent Withdrawals</SectionTitle>
          <ul className="space-y-2">
            {data.recentWd.length === 0 && <Empty />}
            {(data.recentWd as any[]).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 border-b border-[var(--sa-border)] pb-1.5 text-[11px]">
                <span className="uppercase">{w.method_code}</span>
                <span>{Number(w.amount).toFixed(2)}</span>
                <Badge>{w.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Recent Postbacks</SectionTitle>
          <ul className="space-y-2">
            {data.recentPb.length === 0 && <Empty>No postbacks received yet.</Empty>}
            {(data.recentPb as any[]).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 border-b border-[var(--sa-border)] pb-1.5 text-[11px]">
                <span className="truncate font-mono text-[10px]">{p.network ?? "-"}</span>
                <Badge tone={p.processed ? "green" : p.signature_valid ? "yellow" : "red"}>
                  {p.processed ? "processed" : p.signature_valid ? "pending" : "invalid"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>System Health</SectionTitle>
          <ul className="space-y-2 text-[11px]">
            {(data.cron as any[]).map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-2 border-b border-[var(--sa-border)] pb-1.5">
                <span className="truncate">{j.name}</span>
                <Badge>{j.last_status}</Badge>
              </li>
            ))}
            {data.cron.length === 0 && <Empty />}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Top Performing Offerwalls</SectionTitle>
          <ul className="space-y-2 text-[11px]">
            {data.topOfferwalls.length === 0 && <Empty />}
            {(data.topOfferwalls as any[]).map((o) => (
              <li key={o.display_name} className="flex justify-between border-b border-[var(--sa-border)] pb-1.5">
                <span className="truncate">{o.display_name}</span>
                <span className="text-emerald-400">{money(Number(o.revenue))}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Top Performing Networks</SectionTitle>
          <ul className="space-y-2 text-[11px]">
            {data.topNetworks.length === 0 && <Empty />}
            {(data.topNetworks as any[]).map((n) => (
              <li key={n.name} className="flex justify-between border-b border-[var(--sa-border)] pb-1.5">
                <span className="truncate">{n.name}</span>
                <span className="text-emerald-400">{money(Number(n.revenue))}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>Top Revenue Domains</SectionTitle>
          <ul className="space-y-2 text-[11px]">
            {data.domains.length === 0 && <Empty>No domains configured.</Empty>}
            {(data.domains as any[]).map((d) => (
              <li key={d.id} className="flex justify-between border-b border-[var(--sa-border)] pb-1.5">
                <span className="truncate">{d.domain}</span>
                <Badge>{d.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
