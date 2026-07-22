import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtPoints, fmtDate } from "@/lib/format";
import { ChatFeed } from "@/components/ChatFeed";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GlobalPrime" }, { name: "description", content: "Your rewards dashboard." }] }),
  component: Dashboard,
});

type Profile = { name: string | null; email: string; cash_balance: number; points_balance: number; locked_balance: number; currency: "INR" | "USD"; referral_code: string };

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarned, setReferralEarned] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Array<{ id: string; amount: number; currency: string; method_code: string; status: string; created_at: string }>>([]);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: refs }, { data: w }, { data: ann }] = await Promise.all([
        supabase.from("profiles").select("name,email,cash_balance,points_balance,locked_balance,currency,referral_code").eq("id", user.id).maybeSingle(),
        supabase.from("referrals").select("commission_points").eq("referrer_id", user.id),
        supabase.from("withdrawals").select("id,amount,currency,method_code,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("announcements").select("id,title,body,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
      ]);
      if (p) setProfile(p as Profile);
      setReferralCount((refs ?? []).length);
      setReferralEarned((refs ?? []).reduce((a, r) => a + Number(r.commission_points || 0), 0));
      setWithdrawals((w ?? []) as any);
      setAnnouncements((ann ?? []) as any);
    })();
  }, [user.id]);

  if (!profile) return <div className="p-4 text-sm text-gray-500">Loading…</div>;
  const cur = profile.currency;

  const cards = [
    { label: "Cash Balance", val: fmtMoney(Number(profile.cash_balance), cur), bg: "#1a8a7d" },
    { label: "Points Balance", val: fmtPoints(profile.points_balance), bg: "#5a3dba" },
    { label: "Locked Balance", val: fmtMoney(Number(profile.locked_balance), cur), bg: "#e8734a" },
    { label: "Referral Earnings", val: `${fmtPoints(referralEarned)} pts`, bg: "#2563eb" },
    { label: "Referral Count", val: String(referralCount), bg: "#16a34a" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-[#1a1c3a]">Welcome back, {profile.name ?? profile.email}</h1>
          <p className="text-xs text-gray-500">Currency: {cur} · Referral code: <b>{profile.referral_code}</b></p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map((c) => (
            <div key={c.label} style={{ background: c.bg }} className="rounded-lg p-4 text-white">
              <div className="text-xs opacity-85">{c.label}</div>
              <div className="text-2xl font-bold mt-1">{c.val}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-sm text-[#1a1c3a] mb-2">Recent Withdrawals</h2>
          {withdrawals.length === 0 ? (
            <div className="text-xs text-gray-400 py-6 text-center">No withdrawals yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-[#1a1c3a] text-white"><tr>
                <th className="p-2 text-left">Date</th><th className="p-2 text-left">Method</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Status</th>
              </tr></thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b">
                    <td className="p-2">{fmtDate(w.created_at)}</td>
                    <td className="p-2 uppercase">{w.method_code}</td>
                    <td className="p-2">{fmtMoney(Number(w.amount), w.currency as any)}</td>
                    <td className="p-2"><StatusBadge s={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {announcements.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h2 className="font-bold text-sm text-[#1a1c3a] mb-2">📢 News & Announcements</h2>
            <ul className="space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="border-l-4 border-[#e8734a] pl-3 py-1">
                  <div className="font-semibold text-sm">{a.title}</div>
                  <div className="text-xs text-gray-600">{a.body}</div>
                  <div className="text-[10px] text-gray-400">{fmtDate(a.created_at)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <ChatFeed />
      </div>
    </div>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    closed: "bg-gray-100 text-gray-700",
    locked: "bg-orange-100 text-orange-700",
    released: "bg-green-100 text-green-700",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colors[s] ?? "bg-gray-100"}`}>{s}</span>;
}
