import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtMoney } from "@/lib/format";
import { StatusBadge } from "../dashboard";
import { processWithdrawal } from "@/lib/rewards.functions";

export const Route = createFileRoute("/_authenticated/admin/withdrawals")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", context.user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: W,
});

function W() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  async function refresh() {
    let q = supabase.from("withdrawals").select("*, profiles!inner(name,email)").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setItems(data ?? []);
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
      </div>
    </div>
  );
}
