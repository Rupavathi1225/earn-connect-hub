import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate, fmtPoints } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/credit-history")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  head: () => ({ meta: [{ title: "Member Credit History — Admin — Global Prime" }, { name: "description", content: "View member points credit history." }] }),
  component: CreditHistory,
});

type CreditRow = {
  id: string;
  user_id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
  user_email?: string;
};

function CreditHistory() {
  const [items, setItems] = useState<CreditRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("points_ledger")
        .select("*")
        .neq("points", 0)
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
        .select("id, email")
        .in("id", userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));

      const resolved = data.map((r) => ({
        ...r,
        user_email: profileMap.get(r.user_id) ?? r.user_id.substring(0, 8),
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
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">📜 Member Credit History</h1>
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
                <td className="p-2.5 text-gray-700 capitalize"><span className="badge badge-b">{r.type}</span></td>
                <td className="p-2.5 text-gray-700">{r.description}</td>
                <td className={`p-2.5 text-right font-bold ${r.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {r.points >= 0 ? "+" : ""}{fmtPoints(r.points)} pts
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 italic">No credit history found.</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <div className="p-6 text-center text-xs text-gray-400 font-medium">Loading credit history...</div>
        )}
      </div>
    </div>
  );
}
