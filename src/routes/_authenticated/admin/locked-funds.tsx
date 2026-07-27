import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { guardAdminPanel } from "@/lib/admin-guard";
import { fmtDate, fmtMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { releaseLockedFund } from "@/lib/rewards.functions";

export const Route = createFileRoute("/_authenticated/admin/locked-funds")({
  beforeLoad: async ({ context }) => {
    await guardAdminPanel(context.user.id);
  },
  component: LF,
});

function LF() {
  const [items, setItems] = useState<any[]>([]);
  async function refresh() { const { data } = await supabase.from("locked_funds").select("*, profiles!inner(name,email,currency)").order("locked_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { refresh(); }, []);
  async function release(id: string) { if (confirm("Release these funds now?")) { await releaseLockedFund({ data: { id } }); refresh(); } }
  return (
    <div>
      <h1 className="text-lg font-bold text-[#1a1c3a] mb-3">🔒 Locked Funds</h1>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1a1c3a] text-white"><tr>{["User", "Offer", "Amount", "Locked", "Release", "Status", "Action"].map((h) => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="p-2">{l.profiles?.name || l.profiles?.email}</td>
                <td className="p-2">{l.offer_source}</td>
                <td className="p-2 font-semibold">{fmtMoney(Number(l.amount), l.profiles?.currency)}</td>
                <td className="p-2">{fmtDate(l.locked_at)}</td>
                <td className="p-2">{fmtDate(l.release_at)}</td>
                <td className="p-2"><StatusBadge s={l.status} /></td>
                <td className="p-2">{l.status === "locked" && <button onClick={() => release(l.id)} className="bg-[#1a8a7d] text-white px-2 py-1 rounded text-[10px]">Release Now</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
