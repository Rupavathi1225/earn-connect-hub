import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate, fmtPoints, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  head: () => ({ meta: [{ title: " GlobalPrime" }, { name: "description", content: "Admin dashboard." }] }),
  component: Overview,
});

function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [chat, setChat] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();
      const [pending, todayPts, users, totalPts, todaySurveys, chatData] = await Promise.all([
        supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("points_ledger").select("points").gte("created_at", iso),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("points_balance"),
        supabase.from("points_ledger").select("id", { count: "exact", head: true }).gte("created_at", iso).eq("type", "survey"),
        supabase.from("chat_feed").select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats({
        pending: pending.count ?? 0,
        todayPoints: (todayPts.data ?? []).reduce((a, r) => a + Number(r.points || 0), 0),
        users: users.count ?? 0,
        totalPlatformPoints: (totalPts.data ?? []).reduce((a, r) => a + Number(r.points_balance || 0), 0),
        todaySurveys: todaySurveys.count ?? 0,
      });
      setChat(chatData.data ?? []);
    })();
  }, []);
  if (!stats) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  const cards = [
    { l: "Pending Withdrawals", v: stats.pending, bg: "#ef4444" },
    { l: "Today Points Earned", v: fmtPoints(stats.todayPoints), bg: "#1a8a7d" },
    { l: "Total Members", v: stats.users, bg: "#5a3dba" },
    { l: "Total Platform Points", v: fmtPoints(stats.totalPlatformPoints), bg: "#e8734a" },
    { l: "Today's Surveys", v: stats.todaySurveys, bg: "#2563eb" },
  ];
  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">📊 Global prime</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {cards.map((c) => (
          <div key={c.l} style={{ background: c.bg }} className="rounded-lg p-4 text-white">
            <div className="text-xs opacity-90">{c.l}</div>
            <div className="text-2xl font-bold mt-1">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg p-4">
        <h2 className="font-bold text-sm mb-2">💬 Recent Chat Activity</h2>
        <ul className="space-y-1">
          {chat.map((c) => (
            <li key={c.id} className="text-xs border-b py-1"><span className="text-gray-400">{fmtDate(c.created_at)}</span> · {c.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
