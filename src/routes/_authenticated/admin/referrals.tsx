import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate, fmtPoints } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/referrals")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  head: () => ({ meta: [{ title: "Referrals — Admin — GlobalPrime" }, { name: "description", content: "Manage referrals." }] }),
  component: AdminReferrals,
});

type ReferralRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_points: number;
  created_at: string;
  referrer_email?: string;
  referred_email?: string;
};

function AdminReferrals() {
  const [items, setItems] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setItems([]);
        return;
      }

      // Collect user ids to resolve emails
      const userIds = Array.from(
        new Set([
          ...data.map((r) => r.referrer_id),
          ...data.map((r) => r.referred_id),
        ])
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));

      const resolved = data.map((r) => ({
        ...r,
        referrer_email: profileMap.get(r.referrer_id) ?? r.referrer_id.substring(0, 8),
        referred_email: profileMap.get(r.referred_id) ?? r.referred_id.substring(0, 8),
      }));

      setItems(resolved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">👥 Manage Referral Earnings</h1>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white">
            <tr>
              <th className="p-2.5 text-left font-semibold">Date & Time</th>
              <th className="p-2.5 text-left font-semibold">Referrer (User)</th>
              <th className="p-2.5 text-left font-semibold">Referred Member</th>
              <th className="p-2.5 text-right font-semibold">Earned Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="p-2.5 text-gray-700">{fmtDate(r.created_at)}</td>
                <td className="p-2.5 text-gray-900 font-medium">{r.referrer_email}</td>
                <td className="p-2.5 text-gray-700">{r.referred_email}</td>
                <td className="p-2.5 text-right font-bold text-[#1a8a7d]">+{fmtPoints(r.commission_points)} pts</td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400 italic">No referrals found in the system.</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="p-6 text-center text-xs text-gray-400 font-medium">Loading referrals...</div>
        )}
      </div>
    </div>
  );
}
