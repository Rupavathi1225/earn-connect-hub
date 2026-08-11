import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/cash-history")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  head: () => ({ meta: [{ title: "Member Cash History — Admin — Global Prime" }, { name: "description", content: "View member cash transaction history." }] }),
  component: CashHistory,
});

type CashRow = {
  id: string;
  user_id: string;
  cash_delta: number;
  type: string;
  description: string | null;
  created_at: string;
  user_email?: string;
  user_currency?: "INR" | "USD";
};

function CashHistory() {
  const [items, setItems] = useState<CashRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("points_ledger")
        .select("*")
        .neq("cash_delta", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setItems([]);
        return;
      }

      // Collect user ids
      const userIds = Array.from(new Set(data.map((r) => r.user_id)));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, currency")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      const resolved = data.map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          ...r,
          user_email: p?.email ?? r.user_id.substring(0, 8),
          user_currency: p?.currency ?? "USD",
        };
      });

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
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">💰 Member Cash History</h1>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white">
            <tr>
              <th className="p-2.5 text-left font-semibold">Date & Time</th>
              <th className="p-2.5 text-left font-semibold">User</th>
              <th className="p-2.5 text-left font-semibold">Type</th>
              <th className="p-2.5 text-left font-semibold">Source</th>
              <th className="p-2.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="p-2.5 text-gray-700">{fmtDate(r.created_at)}</td>
                <td className="p-2.5 text-gray-900 font-medium">{r.user_email}</td>
                <td className="p-2.5 text-gray-700 capitalize"><span className="badge badge-g">{r.type}</span></td>
                <td className="p-2.5 text-gray-700">{r.description}</td>
                <td className={`p-2.5 text-right font-bold ${r.cash_delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {r.cash_delta >= 0 ? "+" : ""}{fmtMoney(r.cash_delta, r.user_currency as any)}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 italic">No cash history found.</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="p-6 text-center text-xs text-gray-400 font-medium">Loading cash history...</div>
        )}
      </div>
    </div>
  );
}
