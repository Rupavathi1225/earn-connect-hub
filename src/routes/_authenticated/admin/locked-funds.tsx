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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data: lfData, error: lfErr } = await supabase
        .from("locked_funds")
        .select("*")
        .order("locked_at", { ascending: false });

      if (lfErr) {
        throw lfErr;
      }

      if (!lfData || lfData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(lfData.map((x) => x.user_id)));
      const { data: profilesData, error: profErr } = await supabase
        .from("profiles")
        .select("id, name, email, currency")
        .in("id", userIds);

      if (profErr) {
        console.error("Error fetching profiles:", profErr);
      }

      const profilesMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
      const joined = lfData.map((lf) => ({
        ...lf,
        profiles: profilesMap.get(lf.user_id) || null,
      }));

      setItems(joined);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load locked funds");
    } finally {
      setLoading(false);
    }
  }

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
                <td className="p-2">{l.profiles?.name || l.profiles?.email || "Unknown User"}</td>
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
        {loading && (
          <div className="p-6 text-center text-xs text-gray-500 font-medium">
            Loading locked funds...
          </div>
        )}
        {error && (
          <div className="p-6 text-center text-xs text-red-500 font-medium bg-red-50/50">
            ⚠️ Error: {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-500 font-medium">
            No locked funds found in the database.
          </div>
        )}
      </div>
    </div>
  );
}
