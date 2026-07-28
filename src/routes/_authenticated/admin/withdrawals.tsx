import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate, fmtMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { processWithdrawal } from "@/lib/rewards.functions";

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: W,
});

function W() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      let q = supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data: wData, error: wErr } = await q;

      if (wErr) {
        throw wErr;
      }

      if (!wData || wData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(wData.map((x) => x.user_id)));
      const { data: profilesData, error: profErr } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      if (profErr) {
        console.error("Error fetching profiles:", profErr);
      }

      const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
      const joined = wData.map((w) => ({
        ...w,
        profiles: profilesMap.get(w.user_id) || null,
      }));

      setItems(joined);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [filter]);
  async function act(id: string, action: "approve" | "reject") {
    const note = action === "reject" ? prompt("Reason for rejection?") ?? "" : "";
    await processWithdrawal({ data: { id, action, note } });
    refresh();
  }
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-bold text-[#1a1c3a]">💸 Withdrawal Requests</h1>
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded capitalize ${filter === f ? "bg-[#1a1c3a] text-white" : "bg-white"}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["Date", "User", "Email", "Method", "Amount", "Details", "Status", "Actions"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="border-b">
                <td className="p-2">{fmtDate(w.created_at)}</td>
                <td className="p-2">{w.profiles?.name || "-"}</td>
                <td className="p-2">{w.profiles?.email}</td>
                <td className="p-2 uppercase">{w.method_code}</td>
                <td className="p-2 font-semibold">{fmtMoney(Number(w.amount), w.currency)}</td>
                <td className="p-2 text-[10px] font-mono max-w-[180px] truncate" title={JSON.stringify(w.payment_details)}>{JSON.stringify(w.payment_details)}</td>
                <td className="p-2"><StatusBadge s={w.status} /></td>
                <td className="p-2">
                  {w.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => act(w.id, "approve")} className="bg-green-600 text-white px-2 py-1 rounded text-[10px]">Approve</button>
                      <button onClick={() => act(w.id, "reject")} className="bg-red-600 text-white px-2 py-1 rounded text-[10px]">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="p-6 text-center text-xs text-gray-500 font-medium">
            Loading withdrawals...
          </div>
        )}
        {error && (
          <div className="p-6 text-center text-xs text-red-500 font-medium bg-red-50/50">
            ⚠️ Error: {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-500 font-medium">
            No withdrawals found for this filter.
          </div>
        )}
      </div>
    </div>
  );
}
